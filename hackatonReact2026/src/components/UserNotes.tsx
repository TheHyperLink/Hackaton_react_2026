// src/components/UserNotes.tsx
import { useEffect, useState, useRef } from "react"
import { FileTree } from "./files_components/FileTree"
import TipTap from "./notes_components/TipTap"

import {
  getEditorContentJSON,
  getEditorContentMarkdown,
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
      alert("Erreur lors de l'export ZIP");
    }
  };

  /**
   * 🔧 Export PDF - Approche robuste avec sauvegarde temporaire
   */
  const exportPdf = async () => {
    if (!selectedNote) return

    // Sauvegarder l'état original
    const originalContent = selectedNote.content || ""
    
    console.log("=" .repeat(60))
    console.log("🚀 DÉBUT EXPORT PDF")
    console.log("📝 Note ID:", selectedNote.id)
    console.log("📄 Titre:", selectedNote.title)
    console.log("📦 Contenu original (100 premiers caractères):", originalContent.substring(0, 100))
    console.log("🔍 Type de contenu:", originalContent.startsWith("{") ? "JSON ProseMirror" : "Markdown")
    
    try {
      // Convertir le contenu en Markdown
      console.log("⏳ Conversion en Markdown...")
      const markdown = getEditorContentMarkdown()
      
      if (!markdown) {
        console.error("❌ Échec de la conversion en Markdown")
        alert("Impossible de convertir le contenu en Markdown")
        return
      }

      console.log("✅ Markdown généré (200 premiers caractères):")
      console.log(markdown.substring(0, 200))
      console.log("📏 Longueur:", markdown.length, "caractères")

      // Étape 1 : Sauvegarder temporairement en Markdown dans la base de données
      console.log("💾 Sauvegarde temporaire du Markdown dans la base de données...")
      await noteService.updateNote({
        id: selectedNote.id,
        title: selectedNote.title,
        content: markdown,
      })
      console.log("✅ Sauvegarde temporaire réussie")

      // Étape 2 : Générer le PDF via GET
      console.log("📥 Appel au backend pour générer le PDF...")
      console.log("🔗 URL:", `/export/pdf/${selectedNote.id}`)
      const blob = await noteService.exportPdf(selectedNote.id)
      console.log("✅ PDF reçu, taille:", blob.size, "bytes")

      // Étape 3 : Restaurer immédiatement le contenu JSON original
      console.log("♻️ Restauration du contenu JSON original...")
      await noteService.updateNote({
        id: selectedNote.id,
        title: selectedNote.title,
        content: originalContent,
      })
      console.log("✅ Contenu restauré")

      // Étape 4 : Télécharger le PDF
      console.log("💾 Téléchargement du PDF...")
      downloadBlob(blob, `${selectedNote.title || "note"}.pdf`)
      console.log("✅ Export PDF réussi!")
      console.log("=" .repeat(60))

    } catch (err: any) {
      console.error("=" .repeat(60))
      console.error("❌ ERREUR LORS DE L'EXPORT PDF")
      console.error("Type d'erreur:", err.constructor.name)
      console.error("Message:", err.message)
      console.error("Status:", err.status)
      console.error("Stack:", err.stack)
      console.error("=" .repeat(60))
      
      // En cas d'erreur, toujours essayer de restaurer le contenu original
      try {
        console.log("♻️ Tentative de restauration du contenu après erreur...")
        await noteService.updateNote({
          id: selectedNote.id,
          title: selectedNote.title,
          content: originalContent,
        })
        console.log("✅ Contenu restauré après erreur")
      } catch (restoreErr) {
        console.error("❌ ERREUR CRITIQUE: Impossible de restaurer le contenu original!")
        console.error(restoreErr)
      }

      // Afficher l'erreur à l'utilisateur
      const errorMsg = err.message || "Erreur inconnue"
      alert(`Erreur lors de l'export PDF:\n${errorMsg}\n\nVérifiez la console (F12) pour plus de détails.`)
    }
  }

  /**
   * Helper pour télécharger un Blob
   */
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  /**
   * Helpers: détecter si content est un JSON ProseMirror stringifié
   */
  function tryParseJSON(content: string): any | null {
    if (!content) return null
    const trimmed = content.trim()
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
        const fullNoteDetail = await noteService.getNoteById(selectedNote.id)
        
        setSelectedNote(prev => prev ? {
          ...prev,
          sizeBytes: fullNoteDetail.sizeBytes,
          lineCount: fullNoteDetail.lineCount,
          wordCount: fullNoteDetail.wordCount,
          charCount: fullNoteDetail.charCount,
        } : null)

        const noteContent = selectedNote.content ?? ""
        setLastSavedContent(noteContent)

        isLoadingRef.current = true
        isModifiedRef.current = false

        setTimeout(() => {
          const parsed = tryParseJSON(noteContent)

          if (parsed) {
            setEditorContentJSON(parsed)
          } else {
            setEditorContentMarkdown(noteContent)
          }

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

      setSelectedNote(prev => (prev ? { ...prev, content: contentToStore } : null))
      setLastSavedContent(contentToStore)
      isModifiedRef.current = false

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

  const triggerAutoSave = () => {
    if (isLoadingRef.current) return
    if (!isEditable) return

    isModifiedRef.current = true
    setSaveStatus("saving")

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    debounceTimerRef.current = setTimeout(() => {
      autoSave()
    }, 1500)
  }

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  return (
    <div className="flex min-h-dvh w-full">
      <FileTree
        onReloadRequest={reloadFn => {
          reloadFoldersRef.current = reloadFn
        }}
        onNoteClick={(note: NoteNode) => {
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
            autoSave()
          }
          setSelectedNote(note)
        }}
      />

      <div className="flex-1 p-4 flex flex-col">
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
              className="px-3 py-1 rounded bg-green-700 hover:bg-green-600 text-sm hover:cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed"
              onClick={exportPdf}
              disabled={!selectedNote}
              title={!selectedNote ? "Sélectionnez une note" : "Exporter en PDF"}
            >
              📄 Export PDF
            </button>

            <button 
              className="px-3 py-1 rounded bg-green-700 hover:bg-green-600 text-sm hover:cursor-pointer" 
              onClick={exportZip}
              title="Exporter toutes les notes"
            >
              📦 Export ZIP
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col text-white">
          <div className="px-4 pb-2 border-b border-orange-500/40">
            {selectedNote ? (
              <div>
                <h3 className="text-xl font-semibold text-orange-300">{selectedNote.title}</h3>
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

          <div className="flex-1 p-4 overflow-hidden" onInput={triggerAutoSave}>
            <TipTap editable={isEditable} />
          </div>
        </div>
      </div>
    </div>
  )
}