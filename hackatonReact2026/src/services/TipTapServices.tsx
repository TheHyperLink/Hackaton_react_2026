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
  // emitUpdate option est supporté via l’objet options [1](https://tiptap.dev/docs/editor/api/commands/content/set-content)
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
    // si tu veux éviter update ici aussi :
    // emitUpdate: false,  // selon ta version, ça peut aussi marcher
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
 * (optionnel) Export Markdown
 */
export function getEditorContentMarkdown(): string | null {
  if (!editorInstance) return null

  const json = editorInstance.getJSON()

  if ((editorInstance as any).markdown) {
    return (editorInstance as any).markdown.serialize(json)
  }

  return JSON.stringify(json)
}