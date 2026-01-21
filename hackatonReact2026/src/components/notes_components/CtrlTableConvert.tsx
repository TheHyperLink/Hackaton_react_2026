import { Extension } from "@tiptap/core"
import type { EditorState } from "prosemirror-state"
import type { Node as ProseNode } from "prosemirror-model"

function looksLikeTableLine(text: string) {
    const t = text.trim()
    return /^\|.*\|$/.test(t) || /^\|?\s*:?-{3,}.*$/.test(t)
}

function findMarkdownTableRange(state: EditorState) {
    const { $from } = state.selection
    const depth = $from.depth

    const parent = $from.node(depth)
    const parentStartPos = $from.start(depth)
    const index = $from.index(depth)

    let childPos = parentStartPos
    const childPositions: number[] = []
    for (let i = 0; i < parent.childCount; i++) {
        childPositions.push(childPos)
        childPos += parent.child(i).nodeSize
    }

    let startIndex = index
    let endIndex = index

    while (startIndex > 0) {
        const node = parent.child(startIndex - 1)
        if (!node.isTextblock) break
        if (!looksLikeTableLine(node.textContent)) break
        startIndex--
    }

    while (endIndex < parent.childCount - 1) {
        const node = parent.child(endIndex + 1)
        if (!node.isTextblock) break
        if (!looksLikeTableLine(node.textContent)) break
        endIndex++
    }

    const from = childPositions[startIndex]
    const to = childPositions[endIndex] + parent.child(endIndex).nodeSize
    return { from, to }
}

const CtrlEnterTableConvert = Extension.create({
    name: "ctrlEnterTableConvert",

    addKeyboardShortcuts() {
        return {
            // IMPORTANT: avoid conflict with CtrlEnterMarkdown if it uses Ctrl-Enter
            "Shift-Ctrl-Enter": () => {
                const editor = this.editor
                if (!editor?.isEditable) return false

                const { state } = editor
                const schema = state.schema

                const { from, to } = findMarkdownTableRange(state)
                const raw = state.doc.textBetween(from, to, "\n", "\n")

                const lines = raw
                    .split("\n")
                    .map(l => l.trim())
                    .filter(Boolean)

                const sepIndex = lines.findIndex(l => /^\|?\s*:?-{3,}/.test(l))
                if (sepIndex <= 0) return false

                const parseRow = (line: string) =>
                    line.replace(/^\||\|$/g, "").split("|").map(c => c.trim())

                const headerCells = parseRow(lines[sepIndex - 1])
                const bodyRows = lines.slice(sepIndex + 1).map(parseRow)

                const { table, tableRow, tableCell, tableHeader, paragraph } = schema.nodes
                if (!table || !tableRow || !tableCell || !tableHeader || !paragraph) return false

                const headerRow = tableRow.create(
                    null,
                    headerCells.map(cell =>
                        tableHeader.create(null, paragraph.create(null, schema.text(cell)))
                    )
                )

                const rows = bodyRows.map(row =>
                    tableRow.create(
                        null,
                        row.map(cell =>
                            tableCell.create(null, paragraph.create(null, schema.text(cell)))
                        )
                    )
                )

                const tableNode: ProseNode = table.create(null, [headerRow, ...rows])

                editor
                    .chain()
                    .focus()
                    .insertContentAt({ from, to }, tableNode)
                    .run()

                return true
            },
        }
    },
})

export default CtrlEnterTableConvert