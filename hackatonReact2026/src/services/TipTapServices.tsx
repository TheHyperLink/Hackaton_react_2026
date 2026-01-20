
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
   WRITE
   ========================== */

export function setEditorContentMarkdown(markdown: string) {
  if (!editorInstance) return

  editorInstance.commands.setContent(markdown, {
    contentType: "markdown",
  })
}

export function clearEditor() {
  if (!editorInstance) return

  editorInstance.commands.setContent("", {
    contentType: "markdown",
  })
}

/* ==========================
   READ
   ========================== */

/**
 * ✅ Récupère le contenu en Markdown
 * (fallback sécurisé si markdown manager indisponible)
 */
export function getEditorContentMarkdown(): string | null {
  if (!editorInstance) return null

  const json = editorInstance.getJSON()

  // ✅ correction TS : markdown peut être undefined
  if (editorInstance.markdown) {
    return editorInstance.markdown.serialize(json)
  }

  // ✅ fallback sûr (ne plante jamais)
  return JSON.stringify(json)
}

/**
 * ✅ Récupère le contenu brut en JSON TipTap
 */
export function getEditorContentJSON(): JSONContent | null {
  if (!editorInstance) return null
  return editorInstance.getJSON()
}
