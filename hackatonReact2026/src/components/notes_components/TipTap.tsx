
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
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),

      // ✅ Markdown natif
      Markdown.configure({
        indentation: { style: "space", size: 2 },
      }),

      // ✅ Ctrl + Enter = reparse Markdown
      CtrlEnterMarkdown,

      Link.configure({
        autolink: true,
        openOnClick: false,
      }),

      Underline,

      TaskList,
      TaskItem.configure({ nested: true }),

      TableKit.configure({
        table: { resizable: true },
      }),
    ],

    contentType: "markdown",
    content: "Default",
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
      className={`h-full flex flex-col border border-orange-500/40 rounded-xl bg-black/30 ${
        editable ? "" : "cursor-not-allowed"
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
          [&_.ProseMirror]:h-full
        "
      />
    </div>
  )
}
