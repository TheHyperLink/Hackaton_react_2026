import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Mention from "@tiptap/extension-mention"
import { Markdown } from "@tiptap/markdown"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import { TableKit } from "@tiptap/extension-table"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"

import CtrlEnterMarkdown from "./CtrlEnterMarkdown"
import CtrlEnterTableConvert from "./CtrlTableConvert"
import "../../style/tiptap-scrollbar.css"

import {
  registerEditor,
  unregisterEditor,
} from "../../services/TipTapServices"
import { noteService } from "../../services"
import { useEffect, useRef } from "react"
import createMentionSuggestion from "../../services/createMentionSuggestion"

type TiptapProps = {
  editable?: boolean
  onEditorUpdate?: () => void
}

export default function Tiptap({ editable = true, onEditorUpdate }: TiptapProps) {
  // Stocke la liste des notes pour la complétion @mention
  const notesRef = useRef<Array<{ id: number; title: string }>>([])

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        try {
          const list = await noteService.getNotes()
          if (cancelled) return

          // Normalize possible response shapes into an array of notes
          const raw: any = list
          let notesArray: any[] = []

          if (Array.isArray(raw)) notesArray = raw
          else if (raw?.notes) notesArray = raw.notes
          else if (raw?.items) notesArray = raw.items
          else if (raw?.results) notesArray = raw.results
          else if (raw?.data) notesArray = raw.data
          else notesArray = []

          notesRef.current = (notesArray as any[]).map((n: any) => ({ id: n.id, title: n.title }))
        } catch (err) {
          console.error("Erreur chargement notes pour mentions:", err)
        }
      })()
    return () => {
      cancelled = true
    }
  }, [])

  // Instance de l'éditeur TipTap
  const editor = useEditor({
    extensions: [
      // ✅ StarterKit allégé (Markdown gère les listes)
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // On ne met PAS bulletList/orderedList/listItem pour les activer (par défaut true)
      }),

      // ✅ Markdown
      Markdown.configure({
        indentation: { style: "space", size: 2 },
      }),

      // ✅ Raccourcis clavier
      // Ctrl+Enter : reparse markdown (ton extension)
      CtrlEnterMarkdown,

      // Shift+Ctrl+Enter (ou autre) : conversion table
      // ⚠️ IMPORTANT : éviter le même raccourci que CtrlEnterMarkdown
      CtrlEnterTableConvert,

      Link.configure({
        autolink: true,
        openOnClick: false,
        linkOnPaste: true
      }),

      // Mention @ -> insert internal note links
      Mention.configure({
        suggestion: createMentionSuggestion(() => notesRef.current as any),
      }),

      Underline,

      TaskList,
      TaskItem.configure({ nested: true }),

      TableKit.configure({
        table: { resizable: true },
      }),
    ],

    // ✅ TipTap n'a généralement pas besoin de "contentType: markdown"
    // Si tu relies ton app à du markdown, tu le gères via Markdown extension (get/set).
    // contentType: "markdown",  <-- je te conseille de l'enlever sauf si tu es sûr que ton plugin l'utilise.

    content: "Choississez une note.",
    onUpdate: () => {
      if (onEditorUpdate) onEditorUpdate();
    },
  })

  // ✅ Enregistrement service
  useEffect(() => {
    if (!editor) return
    registerEditor(editor)
    return () => unregisterEditor()
  }, [editor])

  // Intercepter les clics sur les liens à l'intérieur de l'éditeur
  useEffect(() => {
    if (!editor) return

    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const anchor = target.closest('a') as HTMLAnchorElement | null
      if (!anchor) return

      const href = anchor.getAttribute('href') || ''
      const match = href.match(/\/notes\/(\d+)/)
      if (match) {
        // Prevent full navigation and stop other handlers (capture phase)
        try {
          event.preventDefault()
        } catch { }
        try {
          // stop other listeners
          event.stopImmediatePropagation()
        } catch { }
        try {
          event.stopPropagation()
        } catch { }

        const noteId = Number(match[1])
        // Dispatch a custom event the app can listen to (SPA navigation)
        window.dispatchEvent(new CustomEvent('spookpad:navigateNote', { detail: { id: noteId } }))
      }
    }

    const dom = editor.view?.dom as HTMLElement | undefined
    // Attach in capture phase to intercept before other listeners
    dom?.addEventListener('click', handler, { capture: true })
    dom?.addEventListener('mousedown', handler, { capture: true })

    return () => {
      dom?.removeEventListener('click', handler, { capture: true })
      dom?.removeEventListener('mousedown', handler, { capture: true })
    }
  }, [editor])

  // ✅ Lecture seule / édition
  useEffect(() => {
    editor?.setEditable(editable)
  }, [editable, editor])

  return (
    <div
      className={`flex flex-col border border-orange-500/40 rounded-xl bg-black/30 ${editable ? "" : "cursor-not-allowed"}`}
      style={{ height: "100%", maxHeight: "73vh", minHeight: 0 }}
    >
      <EditorContent
        editor={editor}
        className="
          flex-1
          overflow-auto
          tiptap-scrollbar
          p-4
          text-white
          outline-none
          [&_a]:text-blue-400
          [&_a]:underline 
          [&_.ProseMirror]:h-full
        "
        style={{ height: "100%", maxHeight: "73vh", minHeight: 0 }}
      />
    </div>
  )
}