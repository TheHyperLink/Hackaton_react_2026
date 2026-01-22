import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Markdown } from "@tiptap/markdown"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import { TableKit } from "@tiptap/extension-table"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import { useEffect } from "react"

import CtrlEnterMarkdown from "./CtrlEnterMarkdown"
import CtrlEnterTableConvert from "./CtrlTableConvert"

import {
  registerEditor,
  unregisterEditor,
} from "../../services/TipTapServices"

type TiptapProps = {
  editable?: boolean
}

export default function Tiptap({ editable = true }: TiptapProps) {
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
  })

  // ✅ Enregistrement service
  useEffect(() => {
    if (!editor) return
    registerEditor(editor)
    return () => unregisterEditor()
  }, [editor])

  // ✅ Lecture seule / édition
  useEffect(() => {
    editor?.setEditable(editable)
  }, [editable, editor])

  return (
    <div
      className={`h-full flex flex-col border border-orange-500/40 rounded-xl bg-black/30 ${editable ? "" : "cursor-not-allowed"
        }`}
    >
      <EditorContent
        editor={editor}
        className="
          flex-1
          overflow-auto
          p-4
          text-white
          outline-none
          [&_a]:text-blue-400
          [&_a]:underline 
          [&_.ProseMirror]:h-full
        "
      />
    </div>
  )
}