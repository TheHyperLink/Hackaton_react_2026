import { Extension } from "@tiptap/core"
import type { Node as ProseNode } from "prosemirror-model"
import type { EditorState } from "prosemirror-state"

type TextblockEntry = {
  start: number
  end: number
  text: string
}

/**
 * Heuristic: determine if a textblock can be part of a markdown table.
 * - Row: | a | b |
 * - Separator: | --- | --- |
 */
function looksLikeTableLine(text: string) {
  const t = text.trim()
  const rowLike = /^\|.*\|$/.test(t)
  const sepLike = /^\|?\s*:?-{3,}.*$/.test(t)
  return rowLike || sepLike
}

/**
 * Collect ALL textblocks (paragraphs, headings, list item paragraphs, etc.)
 * in document order, so we can expand around cursor globally.
 */
function collectTextblocks(state: EditorState): TextblockEntry[] {
  const entries: TextblockEntry[] = []
  const { doc } = state

  doc.nodesBetween(0, doc.content.size, (node, pos) => {
    if (!node.isTextblock) return

    entries.push({
      start: pos, // position before the node
      end: pos + node.nodeSize,
      text: node.textContent ?? "",
    })
  })

  return entries
}

/**
 * Find the range [from, to] of consecutive textblocks around cursor
 * that look like markdown table lines, across the entire document.
 */
function findMarkdownTableRangeDocWise(state: EditorState) {
  const entries = collectTextblocks(state)
  if (entries.length === 0) return null

  const cursorPos = state.selection.from

  const idx = entries.findIndex(e => cursorPos >= e.start && cursorPos < e.end)
  if (idx === -1) return null

  let startIndex = idx
  let endIndex = idx

  // Expand up across previous textblocks
  while (startIndex > 0) {
    const prev = entries[startIndex - 1]
    if (!looksLikeTableLine(prev.text)) break
    startIndex--
  }

  // Expand down across next textblocks
  while (endIndex < entries.length - 1) {
    const next = entries[endIndex + 1]
    if (!looksLikeTableLine(next.text)) break
    endIndex++
  }

  return {
    from: entries[startIndex].start,
    to: entries[endIndex].end,
  }
}

const CtrlEnterMarkdown = Extension.create({
  name: "ctrlEnterTableConvert",

  addKeyboardShortcuts() {
    return {
      /**
       * ⚠️ ATTENTION CONFLIT:
       * Si tu as un autre extension (ex: CtrlEnterMarkdown) qui utilise Ctrl-Enter,
       * ça va se marcher dessus.
       *
       * Recommandation: mets celui-ci sur Shift-Ctrl-Enter,
       * ou supprime/déplace l'autre.
       */
      "Ctrl-Enter": () => {
        const editor = this.editor
        if (!editor?.isEditable) return false

        const { state } = editor
        const schema = state.schema

        const range = findMarkdownTableRangeDocWise(state)
        if (!range) return false

        const { from, to } = range
        const raw = state.doc.textBetween(from, to, "\n", "\n")

        const lines = raw
          .split("\n")
          .map(l => l.trim())
          .filter(Boolean)

        // Find the separator line (---)
        const sepIndex = lines.findIndex(l => /^\|?\s*:?-{3,}/.test(l))
        if (sepIndex <= 0) return false

        const parseRow = (line: string) =>
          line.replace(/^\||\|$/g, "").split("|").map(c => c.trim())

        const headerCells = parseRow(lines[sepIndex - 1])
        const bodyRows = lines.slice(sepIndex + 1).map(parseRow)

        const { table, tableRow, tableCell, tableHeader, paragraph } = schema.nodes
        if (!table || !tableRow || !tableCell || !tableHeader || !paragraph) return false

        // Build header row
        const headerRow = tableRow.create(
          null,
          headerCells.map(cell =>
            tableHeader.create(null, paragraph.create(null, schema.text(cell)))
          )
        )

        // Build body rows
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
          // Replace ONLY the detected markdown-table block
          .insertContentAt({ from, to }, tableNode)
          .run()

        return true
      },
    }
  },
})

export default CtrlEnterMarkdown