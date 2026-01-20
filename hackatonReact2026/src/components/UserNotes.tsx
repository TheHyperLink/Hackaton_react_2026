import { useEffect, useState, useRef } from "react"
import { FileTree } from "./files_components/FileTree"
import TipTap from "./notes_components/TipTap"
import { setEditorContentMarkdown, getEditorContentMarkdown } from "./../services/TipTapServices"
import type { NoteNode } from "../types/NoteNode"
import { noteService } from "../services"

export default function UserNotes() {
  const [isEditable, setIsEditable] = useState(true)
  const [selectedNote, setSelectedNote] = useState<NoteNode | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [lastSavedContent, setLastSavedContent] = useState<string>("")
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isModifiedRef = useRef(false)
  const reloadFoldersRef = useRef<(() => Promise<void>) | null>(null)

  // Recharger le contenu de la note sélectionnée
  useEffect(() => {
    if (!selectedNote) return

    // Charger le contenu complet de la note depuis l'API
    const loadNoteContent = async () => {
      try {
        const noteContent = selectedNote.content
        setLastSavedContent(noteContent)
        isModifiedRef.current = false
        
        // Utiliser un petit délai pour s'assurer que l'éditeur est prêt
        setTimeout(() => {
          setEditorContentMarkdown(noteContent)
        }, 50)
      } catch (error) {
        console.error("Erreur lors du chargement de la note:", error)
      }
    }

    loadNoteContent()
  }, [selectedNote?.id])

  // Fonction de sauvegarde
  const autoSave = async () => {
    if (!selectedNote || !isEditable || !isModifiedRef.current) {
      return
    }

    const content = getEditorContentMarkdown()
    if (!content) return

    try {
      setSaving(true)
      setSaveStatus("saving")

      await noteService.updateNote({
        id: selectedNote.id,
        title: selectedNote.title,
        content: content,
      })

      // Mettre à jour le state selectedNote avec le nouveau contenu
      setSelectedNote(prev => prev ? { ...prev, content } : null)
      setLastSavedContent(content)
      isModifiedRef.current = false
      
      // Recharger les dossiers et notes en temps réel
      if (reloadFoldersRef.current) {
        await reloadFoldersRef.current()
      }
      
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde automatique:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } finally {
      setSaving(false)
    }
  }

  // Debounce : sauvegarde automatique 1.5 secondes après la fin de la modification
  const triggerAutoSave = () => {
    isModifiedRef.current = true
    setSaveStatus("saving")

    // Annuler le timer précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Créer un nouveau timer
    debounceTimerRef.current = setTimeout(() => {
      autoSave()
    }, 1500)
  }

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="flex min-h-dvh w-full">
      {/* Panneau de gauche : FileTree */}
      <FileTree
        onReloadRequest={(reloadFn) => {
          reloadFoldersRef.current = reloadFn
        }}
        onNoteClick={(note: NoteNode) => {
          // Sauvegarder la note précédente si elle a été modifiée
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
            autoSave()
          }

          setSelectedNote(note)
        }}
      />

      {/* Panneau de droite : zone de notes */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Barre en haut : titre + boutons */}
        <div className="flex items-center justify-between mb-4">
          <h2
            className={`text-2xl font-bold ${
              isEditable ? "text-yellow-500" : "text-purple-300"
            }`}
          >
            Notepad en mode {isEditable ? "édition" : "lecture seule"}
          </h2>

          <div className="flex gap-2 items-center">
            {saveStatus === "saving" && (
              <span className="text-yellow-400 text-sm flex items-center gap-1">
                <span className="inline-block animate-spin">⏳</span> Sauvegarde...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-green-400 text-sm">✅ Sauvegardé</span>
            )}
            {saveStatus === "error" && (
              <span className="text-red-400 text-sm">❌ Erreur</span>
            )}

            <button
              className="px-3 py-1 rounded bg-violet-700 hover:bg-violet-600 text-sm hover:cursor-pointer"
              onClick={() => setIsEditable((v: boolean) => !v)}
            >
              {isEditable ? "Lecture seule" : "Édition"}
            </button>
          </div>
        </div>

        {/* Conteneur principal du contenu */}
        <div className="flex-1 flex flex-col text-white">
          {/* Titre de la note sélectionnée */}
          <div className="px-4 pb-2 border-b border-orange-500/40">
            {selectedNote ? (
              <h3 className="text-xl font-semibold text-orange-300">
                {selectedNote.title}
              </h3>
            ) : (
              <span className="text-sm text-gray-400">
                Aucune note sélectionnée
              </span>
            )}
          </div>

          {/* Zone de texte Tiptap */}
          <div className="flex-1 p-4 overflow-hidden" onInput={triggerAutoSave}>
            <TipTap editable={isEditable} />
          </div>
        </div>
      </div>
    </div>
  )
}
