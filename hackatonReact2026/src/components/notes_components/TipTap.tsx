
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Markdown } from "@tiptap/markdown"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import { TableKit } from "@tiptap/extension-table"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"

export default function Tiptap() {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Markdown.configure({
        // options officielles (facultatives)
        indentation: { style: 'space', size: 2 },
      }),
      Link.configure({ autolink: true, openOnClick: false }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      TableKit.configure({ table: { resizable: true } }),
    ],

    contentType: "markdown",
    content: `Default`,

    /**
     * 🔽 Coller du Markdown → parse → insère en tant que nodes
     */
    editorProps: {
      handlePaste(view, event) {
        const clipboardText = event.clipboardData?.getData("text/plain") ?? ""
        if (!clipboardText) return false

        // 1) Heuristique simple : repère un tableau Markdown
        const looksLikeMdTable =
          /^\s*\|.+\|\s*$/m.test(clipboardText) && // une ligne avec des |
          /^\s*\|(?:\s*-+\s*\|)+\s*$/m.test(clipboardText) // ligne de séparateurs |---|

        // élargis si tu veux : titres (# ), listes (- ), etc.
        if (!looksLikeMdTable) return false

        // 2) Convertit Markdown -> JSON Tiptap via l’extension officielle
        //    (API v3 : editor.markdown.parse)
        // @ts-ignore - l'API markdown est ajoutée par l'extension
        const json = editor?.markdown?.parse?.(clipboardText)
        if (!json) return false

        // 3) Insère le contenu au niveau de la sélection
        editor?.chain().focus().insertContent(json).run()

        // Empêche le collage par défaut (texte brut)
        event.preventDefault()
        return true
      },
    },
  })

  
return (
    <div className="h-full flex flex-col border border-orange-500/40 rounded-xl bg-black/30 ">
      <EditorContent
        editor={editor}
        className="
          flex-1
          overflow-auto
          p-4
          text-white
          [&_.ProseMirror]:h-full
        "
      />
    </div>
  )

}
