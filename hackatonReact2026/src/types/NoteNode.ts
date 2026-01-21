export type NoteNode = {
  id: number
  userId: number
  folderId: number
  title: string
  content: string
  createdAt: string
  updatedAt: string
  sizeBytes?: number
  lineCount?: number
  wordCount?: number
  charCount?: number
}