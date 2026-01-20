
import { Extension } from "@tiptap/core"
import { Node as ProseNode } from "prosemirror-model"

const CtrlEnterTableConvert = Extension.create({
  name: "ctrlEnterTableConvert",

  addKeyboardShortcuts() {
    return {
      "Ctrl-Enter": () => {
        const editor = this.editor
        if (!editor?.isEditable) return false

        const schema = editor.state.schema;

        // Récupère le markdown avec sa structure
        const raw = editor.state.doc.textBetween(
          0,
          editor.state.doc.content.size,
          "\n",
          "\n"
        )

        const lines = raw
          .split("\n")
          .map(l => l.trim())
          .filter(Boolean)

        const sepIndex = lines.findIndex(l =>
          /^\|?\s*:?-{3,}/.test(l)
        )

        if (sepIndex <= 0) return false

        const parseRow = (line: string) =>
          line
            .replace(/^\||\|$/g, "")
            .split("|")
            .map(c => c.trim())

        const headerCells = parseRow(lines[sepIndex - 1])
        const bodyRows = lines
          .slice(sepIndex + 1)
          .map(parseRow)

        const {
          table,
          tableRow,
          tableCell,
          tableHeader,
          paragraph,
          text,
        } = schema.nodes

        if (!table || !tableRow || !tableCell || !tableHeader) return false

        // Construction du header
        const headerRow = tableRow.create(
          null,
          headerCells.map(cell =>
            tableHeader.create(
              null,
              paragraph.create(
                        null,
                        schema.text(cell) 
                      )
            )
          )
        )

        // Construction du body
        const rows = bodyRows.map(row =>
          tableRow.create(
            null,
            row.map(cell =>
              tableCell.create(
                null,
                paragraph.create(null, schema.text(cell))
              )
            )
          )
        )

        const tableNode: ProseNode = table.create(
          null,
          [headerRow, ...rows]
        )

        editor
          .chain()
          .focus()
          .deleteRange({
            from: 0,
            to: editor.state.doc.content.size,
          })
          .insertContent(tableNode)
          .run()

        return true
      },
    }
  },
})

export default CtrlEnterTableConvert
