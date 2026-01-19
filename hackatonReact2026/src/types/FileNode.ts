export type FileNode = {
  id: string
  name: string
  type: "folder" | "note"
  children?: FileNode[]
}
