import type { NoteNode } from "./NoteNode"

export type FileNode = {
  id: number
  userId: number
  name: string
  color: string
  parentFolderId: number | null
  createdAt: string
  updatedAt: string
  notes?: NoteNode[]
  subFolders?: FileNode[]
}
