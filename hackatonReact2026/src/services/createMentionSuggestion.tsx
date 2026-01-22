import { ReactRenderer } from "@tiptap/react"
import tippy, { type Instance } from "tippy.js"
import type { MentionItem, MentionListRef } from "../components/notes_components/MentionList"
import MentionList from "../components/notes_components/MentionList"

// Crée la config suggestion pour TipTap
// Accepte une fonction getter pour éviter de recréer l'éditeur quand les notes changent
export function createMentionSuggestion(getNotesFn: () => MentionItem[]) {
    return {
        char: "@",
        items: ({ query }: { query: string }) => {
            const notes = getNotesFn() || []
            return notes
                .filter((note) => note.title?.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 8)
        },

        render: () => {
            let component: ReactRenderer<MentionListRef> | null = null
            let popup: Instance[] | null = null

            return {
                onStart: (props: any) => {
                    component = new ReactRenderer(MentionList, {
                        props: {
                            items: props.items,
                            editor: props.editor,
                            range: props.range,
                            command: (item: MentionItem) => {
                                // Always insert the note title as linked text (avoid inserting the id)
                                try {
                                    props.editor
                                        .chain()
                                        .focus()
                                        .insertContentAt(props.range, [
                                            {
                                                type: "text",
                                                text: item.title,
                                                marks: [{ type: "link", attrs: { href: `/notes/${item.id}` } }],
                                            },
                                        ])
                                        .run()
                                    return true
                                } catch (err) {
                                    console.error("Erreur insertion mention:", err)
                                    return false
                                }
                            },
                        },
                        editor: props.editor,
                    })

                    if (!props.clientRect) return

                    popup = tippy("body", {
                        getReferenceClientRect: props.clientRect,
                        appendTo: () => document.body,
                        content: component.element,
                        showOnCreate: true,
                        interactive: true,
                        trigger: "manual",
                        placement: "bottom-start",
                        theme: "mention",
                    })
                },

                onUpdate: (props: any) => {
                    component?.updateProps({ items: props.items, range: props.range })
                    if (popup && props.clientRect) {
                        popup[0].setProps({ getReferenceClientRect: props.clientRect })
                    }
                },

                onKeyDown: (props: any) => {
                    if (props.event.key === "Escape") {
                        popup?.[0].hide()
                        return true
                    }
                    return component?.ref?.onKeyDown(props) ?? false
                },

                onExit: () => {
                    popup?.[0].destroy()
                    component?.destroy()
                },
            }
        },
    }
}

export default createMentionSuggestion
