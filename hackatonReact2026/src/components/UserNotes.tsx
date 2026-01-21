// src/components/UserNotes.tsx
import { useEffect, useState, useRef } from "react"
import { FileTree } from "./files_components/FileTree"
import TipTap from "./notes_components/TipTap"

import {
  getEditorContentJSON,
  setEditorContentJSON,
  setEditorContentMarkdown,
} from "./../services/TipTapServices"

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
  const isLoadingRef = useRef(false)

  const reloadFoldersRef = useRef<(() => Promise<void>) | null>(null)

    const exportZip = async () => {
  try {
    const blob = await noteService.exportZip();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notes.zip";
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Erreur export ZIP:", err);
  }
};


    const exportPdf = async () => {
  if (!selectedNote) return

  try {
    const blob = await noteService.exportPdf(selectedNote.id)

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedNote.title || "note"}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error("Erreur export PDF:", err)
  }
}

  /**
   * Helpers: détecter si content est un JSON ProseMirror stringifié
   */
  function tryParseJSON(content: string): any | null {
    if (!content) return null
    const trimmed = content.trim()
    // petit guard: si ça ne commence pas par { ou [, on évite parse
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null
    try {
      return JSON.parse(trimmed)
    } catch {
      return null
    }
  }

  // Recharger le contenu de la note sélectionnée
  useEffect(() => {
    if (!selectedNote) return

    const loadNoteContent = async () => {
      try {
        // Charger les données complètes de la note pour obtenir les métadonnées
        const fullNoteDetail = await noteService.getNoteById(selectedNote.id)
        
        // Mettre à jour selectedNote avec les métadonnées
        setSelectedNote(prev => prev ? {
          ...prev,
          sizeBytes: fullNoteDetail.sizeBytes,
          lineCount: fullNoteDetail.lineCount,
          wordCount: fullNoteDetail.wordCount,
          charCount: fullNoteDetail.charCount,
        } : null)

        const noteContent = selectedNote.content ?? ""
        setLastSavedContent(noteContent)

        // Empêche autosave / modifications pendant qu'on injecte le contenu
        isLoadingRef.current = true
        isModifiedRef.current = false

        // On attend que TipTap soit prêt (registerEditor exécuté)
        setTimeout(() => {
          const parsed = tryParseJSON(noteContent)

          if (parsed) {
            // ✅ Nouveau format : JSON
            setEditorContentJSON(parsed)
          } else {
            // 🔁 Ancien format : Markdown (migration douce)
            // Ça affichera correctement (mais compressera les \n vides), puis
            // dès que tu sauvegardes, ça repassera en JSON.
            setEditorContentMarkdown(noteContent)
          }

          // stop loading + reset modified
          setTimeout(() => {
            isModifiedRef.current = false
            isLoadingRef.current = false
            setSaveStatus("idle")
          }, 0)
        }, 50)
      } catch (error) {
        console.error("Erreur lors du chargement de la note:", error)
        isLoadingRef.current = false
      }
    }

    loadNoteContent()
  }, [selectedNote?.id])

  // Fonction de sauvegarde (JSON)
  const autoSave = async () => {
    if (!selectedNote || !isEditable || !isModifiedRef.current) return

    const json = getEditorContentJSON()
    if (!json) return

    try {
      setSaving(true)
      setSaveStatus("saving")

      const contentToStore = JSON.stringify(json)

      await noteService.updateNote({
        id: selectedNote.id,
        title: selectedNote.title,
        content: contentToStore,
      })

      // Mettre à jour le state selectedNote avec le nouveau contenu
      setSelectedNote(prev => (prev ? { ...prev, content: contentToStore } : null))
      setLastSavedContent(contentToStore)
      isModifiedRef.current = false

      // Recharger les données complètes pour mettre à jour les métadonnées
      const fullNoteDetail = await noteService.getNoteById(selectedNote.id)
      setSelectedNote(prev => prev ? {
        ...prev,
        sizeBytes: fullNoteDetail.sizeBytes,
        lineCount: fullNoteDetail.lineCount,
        wordCount: fullNoteDetail.wordCount,
        charCount: fullNoteDetail.charCount,
      } : null)

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
    // ✅ important: ne pas autosave pendant un setContent (load)
    if (isLoadingRef.current) return
    if (!isEditable) return

    isModifiedRef.current = true
    setSaveStatus("saving")

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    debounceTimerRef.current = setTimeout(() => {
      autoSave()
    }, 1500)
  }

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  return (
    <div className="flex min-h-dvh w-full">
      {/* Panneau de gauche : FileTree */}
      <FileTree
        onReloadRequest={reloadFn => {
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
          <h2 className={`text-2xl font-bold ${isEditable ? "text-yellow-500" : "text-purple-300"}`}>
            Spookpad en mode {isEditable ? "édition" : "lecture seule"}
            
          </h2>
        
          <div className="flex gap-2 items-center">
            {saveStatus === "saving" && (
              <span className="text-yellow-400 text-sm flex items-center gap-1">
                <span className="inline-block animate-spin">⏳</span> Sauvegarde...
              </span>
            )}
            {saveStatus === "saved" && <span className="text-green-400 text-sm">✅ Sauvegardé</span>}
            {saveStatus === "error" && <span className="text-red-400 text-sm">❌ Erreur</span>}

            <button
              className="px-3 py-1 rounded bg-violet-700 hover:bg-violet-600 text-sm hover:cursor-pointer"
              onClick={() => setIsEditable(v => !v)}
            >
              {isEditable ? "Lecture seule" : "Édition"}
            </button>
                <button
              className="px-3 py-1 rounded bg-green-700 hover:bg-green-600 text-sm hover:cursor-pointer"
              onClick={exportPdf}
              disabled={!selectedNote}
            >
              Export PDF
            </button>

                        <button className="px-3 py-1 rounded bg-green-700 hover:bg-green-600 text-sm hover:cursor-pointer" onClick={exportZip}>Exporter toutes les notes (ZIP)</button>
          </div>
        </div>

        {/* Conteneur principal du contenu */}
        <div className="flex-1 flex flex-col text-white">
          {/* Titre de la note sélectionnée */}
          <div className="px-4 pb-2 border-b border-orange-500/40">
            {selectedNote ? (
              <div>
                <h3 className="text-xl font-semibold text-orange-300">{selectedNote.title}</h3>
                {/* Métadonnées */}
                <div className="mt-2 flex gap-4 text-xs text-gray-400">
                  {selectedNote.sizeBytes !== undefined && (
                    <span>📦 {(selectedNote.sizeBytes / 1024).toFixed(2)} KB</span>
                  )}
                  {selectedNote.charCount !== undefined && (
                    <span>🔤 {selectedNote.charCount} caractères</span>
                  )}
                  {selectedNote.wordCount !== undefined && (
                    <span>📝 {selectedNote.wordCount} mots</span>
                  )}
                  {selectedNote.lineCount !== undefined && (
                    <span>📄 {selectedNote.lineCount} lignes</span>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-sm text-gray-400">Aucune note sélectionnée</span>
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