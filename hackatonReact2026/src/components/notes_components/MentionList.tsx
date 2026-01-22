import React, { useEffect, useImperativeHandle, useRef, useState } from "react"
import type { Editor } from "@tiptap/react"

export type MentionItem = { id: number; title: string }

export type MentionListRef = {
    onKeyDown: (props: any) => boolean
}

type Props = {
    items: MentionItem[]
    editor: Editor
    range: any
    command: (item: MentionItem) => void
}

// Liste de suggestions pour @mention dans TipTap
const MentionList = React.forwardRef<MentionListRef, Props>((props, ref) => {
    // Liste des suggestions à afficher
    const { items = [], command, editor, range } = props
    // Index de la suggestion sélectionnée
    const [index, setIndex] = useState(0)
    // Référence vers la div de la liste
    const listRef = useRef<HTMLDivElement | null>(null)

    useImperativeHandle(ref, () => ({
        onKeyDown: (keyProps: any) => {
            const event = keyProps.event as KeyboardEvent
            if (event.key === "ArrowDown") {
                setIndex(i => Math.min(i + 1, items.length - 1))
                return true
            }
            if (event.key === "ArrowUp") {
                setIndex(i => Math.max(i - 1, 0))
                return true
            }
            if (event.key === "Enter") {
                const item = items[index]
                if (item) {
                    // Use provided command (or fallback to manual insert)
                    try {
                        if (command) return command(item)
                    } catch {
                        // fallback: insert a link at the range
                        try {
                            editor.chain().focus().insertContentAt(range, {
                                type: "text",
                                text: item.title,
                                marks: [{ type: "link", attrs: { href: `/notes/${item.id}` } }],
                            }).run()
                            return true
                        } catch {
                            return false
                        }
                    }
                }
                return false
            }
            if (event.key === "Escape") {
                return false
            }
            return false
        },
    }))

    useEffect(() => {
        // reset index when items change
        setIndex(0)
    }, [items])

    return (
        <div ref={listRef} className="bg-black/90 text-white rounded shadow-lg p-1 max-h-56 overflow-auto w-64">
            {items.length === 0 ? (
                <div className="p-2 text-gray-400 text-sm">Aucune note trouvée</div>
            ) : (
                items.map((item, i) => (
                    <div
                        key={item.id}
                        onMouseDown={(e) => {
                            e.preventDefault()
                            // call command to insert
                            try {
                                if (command) command(item)
                                else
                                    editor.chain().focus().insertContentAt(range, {
                                        type: "text",
                                        text: item.title,
                                        marks: [{ type: "link", attrs: { href: `/notes/${item.id}` } }],
                                    }).run()
                            } catch (err) {
                                console.error(err)
                            }
                        }}
                        className={`px-3 py-2 cursor-pointer ${i === index ? "bg-orange-500/40" : "hover:bg-white/5"}`}
                    >
                        <div className="text-sm font-medium truncate">{item.title}</div>
                        <div className="text-xs text-gray-300">#{item.id}</div>
                    </div>
                ))
            )}
        </div>
    )
})

export default MentionList
