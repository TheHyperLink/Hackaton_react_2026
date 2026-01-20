
import { useEffect, useState } from "react"
import { FileTree } from "./files_components/FileTree"
import TipTap from "./notes_components/TipTap"
import { setEditorContentMarkdown, getEditorContentMarkdown } from "./../services/TipTapServices"

export default function UserNotes() {
  const [isEditable, setIsEditable] = useState(true)
  const [markdown, setMarkdown] = useState<string>("")

  
  function handleSave() {
    const content = getEditorContentMarkdown()
    if (!content) return
    setMarkdown(content)
  }

  
useEffect(() => {
  if (markdown === "") return
  console.log(markdown)
}, [markdown])



  return (
    <div className="flex min-h-dvh">
      {/* Panneau de gauche : FileTree */}
      <FileTree onNoteClick={(content) => setEditorContentMarkdown(content)} />

      {/* Panneau de droite : zone de notes */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Barre en haut : titre + boutons */}
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-bold ${isEditable ? "text-yellow-500" : "text-purple-300"}`}>Notepad en mode {isEditable ? "édition" : "lecture seule"}</h2>

          <div className="flex gap-2">
            <button className="px-3 py-1 rounded bg-violet-700 hover:bg-violet-600 text-sm hover:cursor-pointer" 
            onClick={() => setIsEditable((v) => !v)}>
              {isEditable ? "Lecture seule" : "Édition"}
            </button>
            <button className="px-3 py-1 rounded bg-orange-600 hover:bg-orange-500 text-sm hover:cursor-pointer"
            onClick={() => { handleSave() }}>
            
              <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 10V4a1 1 0 0 0-1-1H9.914a1 1 0 0 0-.707.293L5.293 7.207A1 1 0 0 0 5 7.914V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2M10 3v4a1 1 0 0 1-1 1H5m5 6h9m0 0-2-2m2 2-2 2"/>
              </svg>

            </button>
          </div>
        </div>

        
      <div className="min-h-dvh flex flex-col text-white">  

        {/* Zone de texte Tiptap */}
        <div className="flex-1 p-4 overflow-hidden">
          <TipTap editable={isEditable} />
        </div>
      </div>
      </div>
    </div>
  )
}