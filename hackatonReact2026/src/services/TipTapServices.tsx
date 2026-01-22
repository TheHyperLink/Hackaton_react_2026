import type { Editor, JSONContent } from "@tiptap/react"

let editorInstance: Editor | null = null

/* ==========================
   Lifecycle
   ========================== */

export function registerEditor(editor: Editor) {
  editorInstance = editor
}

export function unregisterEditor() {
  editorInstance = null
}

export function isEditorReady() {
  return editorInstance !== null
}

/* ==========================
   Helpers
   ========================== */

const EMPTY_DOC: JSONContent = { type: "doc", content: [] }

function tryParseProseMirrorJSON(input: string): JSONContent | null {
  if (!input) return null
  const trimmed = input.trim()
  if (!trimmed.startsWith("{")) return null

  try {
    const parsed = JSON.parse(trimmed)
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.type === "doc" &&
      Array.isArray(parsed.content)
    ) {
      return parsed as JSONContent
    }
    return null
  } catch {
    return null
  }
}

/* ==========================
   WRITE
   ========================== */

/**
 * ✅ Nouveau: injecter du JSON ProseMirror (source de vérité)
 * Préserve les lignes vides, etc.
 */
export function setEditorContentJSON(json: JSONContent) {
  if (!editorInstance) return
  editorInstance.commands.setContent(json, { emitUpdate: false })
}

/**
 * (optionnel mais pratique)
 * Charge automatiquement: JSON ProseMirror stringifié -> JSON, sinon -> Markdown
 */
export function setEditorContentAuto(content: string) {
  if (!editorInstance) return

  const parsed = tryParseProseMirrorJSON(content)
  if (parsed) {
    setEditorContentJSON(parsed)
  } else {
    setEditorContentMarkdown(content)
  }
}

/**
 * ⚠️ Ancien: injecter du Markdown (migration / compat)
 */
export function setEditorContentMarkdown(markdown: string) {
  if (!editorInstance) return

  editorInstance.commands.setContent(markdown, {
    contentType: "markdown",
  })
}

export function clearEditor() {
  if (!editorInstance) return
  editorInstance.commands.setContent(EMPTY_DOC, { emitUpdate: false })
}

/* ==========================
   READ
   ========================== */

/**
 * ✅ JSON brut (source de vérité)
 */
export function getEditorContentJSON(): JSONContent | null {
  if (!editorInstance) return null
  return editorInstance.getJSON()
}

/**
 * ✅ Export Markdown amélioré
 * Utilise l'extension Markdown de TipTap pour une conversion propre
 */
export function getEditorContentMarkdown(): string | null {
  if (!editorInstance) {
    console.error("❌ Editor instance n'est pas disponible")
    return null
  }

  try {
    // Méthode 1 : Utiliser l'extension Markdown de TipTap (méthode officielle)
    const markdownExtension = editorInstance.extensionManager.extensions.find(
      ext => ext.name === 'markdown'
    )
    
    if (markdownExtension) {
      // Essayer d'accéder au storage de l'extension
      const storage = (markdownExtension as any).storage
      if (storage?.getMarkdown) {
        const md = storage.getMarkdown()
        // console.log("✅ Markdown extrait via extension:", md.substring(0, 100))
        return md
      }
      
      // Essayer la méthode serialize si disponible
      if ((markdownExtension as any).options?.serialize) {
        const json = editorInstance.getJSON()
        const md = (markdownExtension as any).options.serialize(json)
        // console.log("✅ Markdown sérialisé:", md.substring(0, 100))
        return md
      }
    }

    // Méthode 2 : Vérifier le storage global
    const globalStorage = (editorInstance as any).storage?.markdown
    if (globalStorage?.getMarkdown) {
      const md = globalStorage.getMarkdown()
      // console.log("✅ Markdown du storage global:", md.substring(0, 100))
      return md
    }

    // Méthode 3 : Conversion manuelle (fallback robuste)
    console.warn("⚠️ Utilisation de la conversion manuelle JSON -> Markdown")
    const json = editorInstance.getJSON()
    const md = convertJSONToMarkdown(json)
    // console.log("✅ Markdown converti manuellement:", md.substring(0, 100))
    return md
  } catch (error) {
    console.error("❌ Erreur lors de la conversion en Markdown:", error)
    // En dernier recours, retourner le texte brut
    try {
      const text = editorInstance.getText()
      console.warn("⚠️ Retour du texte brut (sans formatage):", text.substring(0, 100))
      return text
    } catch {
      return null
    }
  }
}

/**
 * Conversion manuelle JSON -> Markdown (fallback)
 */
function convertJSONToMarkdown(json: JSONContent): string {
  if (!json || !json.content) {
    console.warn("⚠️ JSON vide ou invalide")
    return ""
  }

  const lines: string[] = []

  for (const node of json.content) {
    const converted = convertNodeToMarkdown(node)
    if (converted) {
      lines.push(converted)
    }
  }

  return lines.join("\n\n").trim()
}

function convertNodeToMarkdown(node: JSONContent, depth = 0): string {
  if (!node.type) return ""

  switch (node.type) {
    case "paragraph":
      return convertInlineContent(node.content || [])

    case "heading":
      const level = node.attrs?.level || 1
      const headingText = convertInlineContent(node.content || [])
      return "#".repeat(level) + " " + headingText

    case "bulletList":
      return (node.content || [])
        .map(item => "  ".repeat(depth) + "- " + convertNodeToMarkdown(item, depth + 1))
        .join("\n")

    case "orderedList":
      return (node.content || [])
        .map((item, idx) => "  ".repeat(depth) + `${idx + 1}. ` + convertNodeToMarkdown(item, depth + 1))
        .join("\n")

    case "listItem":
      return (node.content || [])
        .map(child => convertNodeToMarkdown(child, depth))
        .join("\n")

    case "taskList":
      return (node.content || [])
        .map(item => convertNodeToMarkdown(item, depth))
        .join("\n")

    case "taskItem":
      const checked = node.attrs?.checked ? "[x]" : "[ ]"
      const taskText = convertInlineContent(node.content || [])
      return "  ".repeat(depth) + `- ${checked} ${taskText}`

    case "codeBlock":
      const language = node.attrs?.language || ""
      const code = node.content?.[0]?.text || ""
      return "```" + language + "\n" + code + "\n```"

    case "blockquote":
      return (node.content || [])
        .map(child => "> " + convertNodeToMarkdown(child, depth))
        .join("\n")

    case "horizontalRule":
      return "---"

    case "table":
      return convertTableToMarkdown(node)

    default:
      return ""
  }
}

function convertInlineContent(content: JSONContent[]): string {
  if (!content) return ""

  return content
    .map(node => {
      if (node.type === "text") {
        let text = node.text || ""
        
        // Appliquer les marks (gras, italique, etc.)
        if (node.marks) {
          for (const mark of node.marks) {
            switch (mark.type) {
              case "bold":
                text = `**${text}**`
                break
              case "italic":
                text = `*${text}*`
                break
              case "code":
                text = "`" + text + "`"
                break
              case "strike":
                text = `~~${text}~~`
                break
              case "underline":
                text = `<u>${text}</u>`
                break
              case "link":
                const href = mark.attrs?.href || ""
                text = `[${text}](${href})`
                break
            }
          }
        }
        
        return text
      }
      
      if (node.type === "hardBreak") {
        return "  \n"
      }
      
      return ""
    })
    .join("")
}

function convertTableToMarkdown(tableNode: JSONContent): string {
  if (!tableNode.content) return ""

  const rows = tableNode.content
  let markdown = ""

  rows.forEach((row, rowIndex) => {
    if (!row.content) return

    const cells = row.content.map(cell => {
      const text = cell.content?.[0]?.content?.[0]?.text || ""
      return text
    })

    markdown += "| " + cells.join(" | ") + " |\n"

    // Ajouter la ligne de séparation après le header
    if (rowIndex === 0) {
      markdown += "| " + cells.map(() => "---").join(" | ") + " |\n"
    }
  })

  return markdown
}