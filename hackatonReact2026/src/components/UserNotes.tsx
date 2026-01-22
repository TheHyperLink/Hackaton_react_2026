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

import ShortcutOverlay from "./ShortcutOverlay";
import type { NoteNode } from "../types/NoteNode"
import { folderService, noteService } from "../services"

export default function UserNotes() {

  const [showShortcuts, setShowShortcuts] = useState(false);
  // État d'édition de l'éditeur
  const [isEditable, setIsEditable] = useState(true)
  // Note sélectionnée
  const [selectedNote, setSelectedNote] = useState<NoteNode | null>(null)

  // Indique si une sauvegarde est en cours
  const [saving, setSaving] = useState(false)
  // Statut de la sauvegarde automatique
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  // Dernier contenu sauvegardé
  const [lastSavedContent, setLastSavedContent] = useState<string>("")

  // Timer pour le debouncing de l'autosave
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Indique si la note a été modifiée
  const isModifiedRef = useRef(false)
  // Indique si une opération de chargement est en cours
  const isLoadingRef = useRef(false)

  // Permet de déclencher un reload des dossiers depuis un composant enfant
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

    // console.log("=".repeat(60))
    // console.log("🚀 DÉBUT EXPORT PDF")
    // console.log("📝 Note ID:", selectedNote.id)
    // console.log("📄 Titre:", selectedNote.title)
    // console.log("📦 Contenu original (100 premiers caractères):", originalContent.substring(0, 100))
    // console.log("🔍 Type de contenu:", originalContent.startsWith("{") ? "JSON ProseMirror" : "Markdown")

    try {
      // Convertir le contenu en Markdown
      // console.log("⏳ Conversion en Markdown...")
      const markdown = getEditorContentMarkdown()

      if (!markdown) {
        console.error("❌ Échec de la conversion en Markdown")
        alert("Impossible de convertir le contenu en Markdown")
        return
      }

      // console.log("✅ Markdown généré (200 premiers caractères):")
      // console.log(markdown.substring(0, 200))
      // console.log("📏 Longueur:", markdown.length, "caractères")

      // Étape 1 : Sauvegarder temporairement en Markdown dans la base de données
      // console.log("💾 Sauvegarde temporaire du Markdown dans la base de données...")
      await noteService.updateNote({
        id: selectedNote.id,
        title: selectedNote.title,
        content: markdown,
      })
      // console.log("✅ Sauvegarde temporaire réussie")

      // Étape 2 : Générer le PDF via GET
      // console.log("📥 Appel au backend pour générer le PDF...")
      // console.log("🔗 URL:", `/export/pdf/${selectedNote.id}`)
      const blob = await noteService.exportPdf(selectedNote.id)
      // console.log("✅ PDF reçu, taille:", blob.size, "bytes")

      // Étape 3 : Restaurer immédiatement le contenu JSON original
      // console.log("♻️ Restauration du contenu JSON original...")
      await noteService.updateNote({
        id: selectedNote.id,
        title: selectedNote.title,
        content: originalContent,
      })
      // console.log("✅ Contenu restauré")

      // Étape 4 : Télécharger le PDF
      // console.log("💾 Téléchargement du PDF...")
      downloadBlob(blob, `${selectedNote.title || "note"}.pdf`)
      // console.log("✅ Export PDF réussi!")
      // console.log("=".repeat(60))

    } catch (err: any) {
      console.error("=".repeat(60))
      console.error("❌ ERREUR LORS DE L'EXPORT PDF")
      console.error("Type d'erreur:", err.constructor.name)
      console.error("Message:", err.message)
      console.error("Status:", err.status)
      console.error("Stack:", err.stack)
      console.error("=".repeat(60))

      // En cas d'erreur, toujours essayer de restaurer le contenu original
      try {
        // console.log("♻️ Tentative de restauration du contenu après erreur...")
        await noteService.updateNote({
          id: selectedNote.id,
          title: selectedNote.title,
          content: originalContent,
        })
        // console.log("✅ Contenu restauré après erreur")
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

  // Écoute navigation SPA depuis l'éditeur (clics sur mentions)
  useEffect(() => {
    const handler = async (e: Event) => {
      const custom = e as CustomEvent
      const id = custom?.detail?.id
      if (!id) return

      try {
        const full = await noteService.getNoteById(id)
        setSelectedNote((prev) => ({
          id: full.id,
          userId: full.userId ?? prev?.userId ?? 0,
          folderId: full.folderId ?? prev?.folderId ?? 0,
          title: full.title,
          content: full.content,
          createdAt: full.createdAt ?? new Date().toISOString(),
          updatedAt: full.updatedAt ?? new Date().toISOString(),
          sizeBytes: full.sizeBytes,
          lineCount: full.lineCount,
          wordCount: full.wordCount,
          charCount: full.charCount,
        }))
      } catch (err) {
        console.error('Erreur navigation note:', err)
      }
    }

    window.addEventListener('spookpad:navigateNote', handler as EventListener)
    return () => window.removeEventListener('spookpad:navigateNote', handler as EventListener)
  }, [])

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

function wrapMarkdown(before: string, after: string = before) {
    const textarea = document.querySelector("textarea");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);

    const newText =
      textarea.value.substring(0, start) +
      before +
      selected +
      after +
      textarea.value.substring(end);

    textarea.value = newText;

    textarea.selectionStart = start + before.length;
    textarea.selectionEnd = end + before.length;
  }

  function insertMarkdown(text: string) {
    const textarea = document.querySelector("textarea");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newText =
      textarea.value.substring(0, start) + text + textarea.value.substring(end);

    textarea.value = newText;

    textarea.selectionStart = textarea.selectionEnd = start + text.length;
  }

  useEffect(() => {
    async function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }
      // Ctrl + ALT + N → New note
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        const folderId =
          selectedNote?.folderId || (await folderService.getRootFolderId());
        await noteService.createNote({
          folderId,
          title: "Nouvelle note",
          content: "",
        });
        reloadFoldersRef.current?.();
      } // Ctrl + Shift + M → New folder
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        const folderId =
          selectedNote?.folderId || (await folderService.getRootFolderId());
        await folderService.createFolder({
          name: "Nouveau dossier",
          color: "#FF6B6B",
          parentFolderId: folderId,
        });
        reloadFoldersRef.current?.();
      } // Ctrl + D → Duplicate note
      if (e.ctrlKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (selectedNote) {
          const folderId =
            selectedNote.folderId || (await folderService.getRootFolderId());
          await noteService.createNote({
            folderId,
            title: `${selectedNote.title} (copie)`,
            content: selectedNote.content,
          });
          reloadFoldersRef.current?.();
        }
      } // Delete → Delete selected note
      if (e.key === "Delete") {
        if (selectedNote && confirm("Supprimer cette note ?")) {
          await noteService.deleteNote(selectedNote.id);
          setSelectedNote(null);
          reloadFoldersRef.current?.();
          window.location.reload();
        }
      } // F2 → Rename selected note
      if (e.key === "F2") {
        if (selectedNote) {
          const newTitle = prompt("Nouveau titre :", selectedNote.title);
          if (newTitle?.trim()) {
            await noteService.updateNote({
              id: selectedNote.id,
              title: newTitle,
              content: selectedNote.content,
            });
            reloadFoldersRef.current?.();
          }
        }
      } // Ctrl + P → Export PDF
      if (e.ctrlKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        exportPdf();
      }
      // Ctrl + Shift + P → Export ZIP
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        exportZip();
      } // Ctrl + E → Toggle edit/read mode
      if (e.ctrlKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setIsEditable((prev) => !prev);
      }
      // F1 → Toggle shortcut overlay
      if (e.key === "F1") {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
      // Ctrl + B → Bold
      if (e.ctrlKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        wrapMarkdown("**");
      }
      // Ctrl + I → Italic
      if (e.ctrlKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        wrapMarkdown("*");
      } // Ctrl + U → Underline (Markdown extension)
      if (e.ctrlKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
        wrapMarkdown("__");
      }
      // Ctrl + Shift + X → Strikethrough
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "x") {
        e.preventDefault();
        wrapMarkdown("~~");
      }
      // Ctrl + Alt + C → Code block
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        insertMarkdown("\n```\n");
      }
      // Ctrl + Shift + 8 → Bullet list
      if (e.ctrlKey && e.shiftKey && e.key === "8") {
        e.preventDefault();
        insertMarkdown("\n- ");
      }
      // Ctrl + Shift + 7 → Numbered list
      if (e.ctrlKey && e.shiftKey && e.key === "7") {
        e.preventDefault();
        insertMarkdown("\n1. ");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedNote]);


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
          <h3 className={`text-2xl font-bold hover:animate-spin ${isEditable ? "text-yellow-500" : "text-purple-300"}`}>

            Spookpad en mode {isEditable ? "édition" : "lecture seule"}
          </h3>
          <span className="text-gray-500">Appuyez sur F1 pour voir la liste des raccourcis.</span>

          <div className="flex gap-2 items-center">

            <button
              className={`flex items-center gap-1 px-3 py-1 rounded ${isEditable ? "bg-yellow-600 hover:bg-yellow-500" : "bg-purple-700 hover:bg-purple-600"} text-sm hover:cursor-pointer`}
              onClick={() => setIsEditable(v => !v)}
            >
              {isEditable ?
                <svg className="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M11 4.717c-2.286-.58-4.16-.756-7.045-.71A1.99 1.99 0 0 0 2 6v11c0 1.133.934 2.022 2.044 2.007 2.759-.038 4.5.16 6.956.791V4.717Zm2 15.081c2.456-.631 4.198-.829 6.956-.791A2.013 2.013 0 0 0 22 16.999V6a1.99 1.99 0 0 0-1.955-1.993c-2.885-.046-4.76.13-7.045.71v15.081Z" clipRule="evenodd" />
                </svg> :
                <svg className="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M11.32 6.176H5c-1.105 0-2 .949-2 2.118v10.588C3 20.052 3.895 21 5 21h11c1.105 0 2-.948 2-2.118v-7.75l-3.914 4.144A2.46 2.46 0 0 1 12.81 16l-2.681.568c-1.75.37-3.292-1.263-2.942-3.115l.536-2.839c.097-.512.335-.983.684-1.352l2.914-3.086Z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M19.846 4.318a2.148 2.148 0 0 0-.437-.692 2.014 2.014 0 0 0-.654-.463 1.92 1.92 0 0 0-1.544 0 2.014 2.014 0 0 0-.654.463l-.546.578 2.852 3.02.546-.579a2.14 2.14 0 0 0 .437-.692 2.244 2.244 0 0 0 0-1.635ZM17.45 8.721 14.597 5.7 9.82 10.76a.54.54 0 0 0-.137.27l-.536 2.84c-.07.37.239.696.588.622l2.682-.567a.492.492 0 0 0 .255-.145l4.778-5.06Z" clipRule="evenodd" />
                </svg>
              }
              {isEditable ? "Lecture seule" : "Édition"}
            </button>

            <button
              className="flex items-center gap-1 px-3 py-1 rounded bg-orange-500 hover:bg-orange-400 text-sm hover:cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed"
              onClick={exportPdf}
              disabled={!selectedNote}
              title={!selectedNote ? "Sélectionnez une note" : "Exporter en PDF"}
            >
              <svg className="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M9 2.221V7H4.221a2 2 0 0 1 .365-.5L8.5 2.586A2 2 0 0 1 9 2.22ZM11 2v5a2 2 0 0 1-2 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2 2 2 0 0 0 2 2h12a2 2 0 0 0 2-2 2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2V4a2 2 0 0 0-2-2h-7Zm-6 9a1 1 0 0 0-1 1v5a1 1 0 1 0 2 0v-1h.5a2.5 2.5 0 0 0 0-5H5Zm1.5 3H6v-1h.5a.5.5 0 0 1 0 1Zm4.5-3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1.376A2.626 2.626 0 0 0 15 15.375v-1.75A2.626 2.626 0 0 0 12.375 11H11Zm1 5v-3h.375a.626.626 0 0 1 .625.626v1.748a.625.625 0 0 1-.626.626H12Zm5-5a1 1 0 0 0-1 1v5a1 1 0 1 0 2 0v-1h1a1 1 0 1 0 0-2h-1v-1h1a1 1 0 1 0 0-2h-2Z" clipRule="evenodd" />
              </svg>

              Export PDF
            </button>

            <button
              className="flex items-center gap-1 px-3 py-1 rounded bg-black hover:bg-gray-500 text-sm hover:cursor-pointer"
              onClick={exportZip}
              title="Exporter toutes les notes"
            >
              <svg className="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M9 2.221V7H4.221a2 2 0 0 1 .365-.5L8.5 2.586A2 2 0 0 1 9 2.22ZM11 2v5a2 2 0 0 1-2 2H4v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-7Zm3 2h2.01v2.01h-2V8h2v2.01h-2V12h2v2.01h-2V16h2v2.01h-2v2H12V18h2v-1.99h-2V14h2v-1.99h-2V10h2V8.01h-2V6h2V4Z" clipRule="evenodd" />
              </svg>


              Export ZIP
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col text-white">
          <div className="px-4 pb-2 border-b border-orange-500/40">
            {selectedNote ? (
              <div>
                <h3 className="text-xl font-semibold text-orange-300">{selectedNote.title}</h3>
                <div className="mt-4 flex gap-8 text-xs text-gray-400 items-center">
                  {selectedNote.sizeBytes !== undefined && (
                    <span>
                      <svg className="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="orange" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.2857 7V5.78571c0-.43393-.3482-.78571-.7778-.78571H6.06345c-.42955 0-.77777.35178-.77777.78571V16m0 0h-1c-.55229 0-1 .4477-1 1v1c0 .5523.44771 1 1 1h5m-4-3h4m7.00002-6v3c0 .5523-.4477 1-1 1h-3m8-3v8c0 .5523-.4477 1-1 1h-6c-.5523 0-1-.4477-1-1v-5.397c0-.2536.0963-.4977.2696-.683l2.434-2.603c.189-.2022.4535-.317.7304-.317h3.566c.5523 0 1 .4477 1 1Z" />
                      </svg>

                      {(selectedNote.sizeBytes / 1024).toFixed(2)} KB</span>
                  )}
                  {selectedNote.charCount !== undefined && (
                    <span>
                      <svg className="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="orange" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m10.5785 19 4.2979-10.92966c.0369-.09379.1674-.09379.2042 0L19.3785 19m-8.8 0H9.47851m1.09999 0h1.65m7.15 0h-1.65m1.65 0h1.1m-7.7-3.9846h4.4M3 16l1.56685-3.9846m0 0 2.73102-6.94506c.03688-.09379.16738-.09379.20426 0l2.50367 6.94506H4.56685Z" />
                      </svg>

                      {selectedNote.charCount} caractères</span>
                  )}
                  {selectedNote.wordCount !== undefined && (
                    <span>
                      <svg className="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="orange" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M3.559 4.544c.355-.35.834-.544 1.33-.544H19.11c.496 0 .975.194 1.33.544.356.35.559.829.559 1.331v9.25c0 .502-.203.981-.559 1.331-.355.35-.834.544-1.33.544H15.5l-2.7 3.6a1 1 0 0 1-1.6 0L8.5 17H4.889c-.496 0-.975-.194-1.33-.544A1.868 1.868 0 0 1 3 15.125v-9.25c0-.502.203-.981.559-1.331ZM7.556 7.5a1 1 0 1 0 0 2h8a1 1 0 0 0 0-2h-8Zm0 3.5a1 1 0 1 0 0 2H12a1 1 0 1 0 0-2H7.556Z" clipRule="evenodd" />
                      </svg>

                      {selectedNote.wordCount} mots</span>
                  )}
                  {selectedNote.lineCount !== undefined && (
                    <span>
                      <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="orange" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6h8m-8 4h12M6 14h8m-8 4h12" />
                      </svg>

                      {selectedNote.lineCount} lignes</span>
                  )}

                  {/* feedback du debouncing */}
                  <span
                    className="ml-auto flex items-center"
                    style={{ minWidth: "110px", justifyContent: "flex-end" }}
                  >
                    <span style={{ width: 24, height: 24, display: "inline-block", marginRight: 4 }}>
                      {saveStatus === "saving" && (
                        <span className="inline-block animate-pulse">
                          <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="orange" viewBox="0 0 24 24">
                            <path d="M13.383 4.076a6.5 6.5 0 0 0-6.887 3.95A5 5 0 0 0 7 18h3v-4a2 2 0 0 1-1.414-3.414l2-2a2 2 0 0 1 2.828 0l2 2A2 2 0 0 1 14 14v4h4a4 4 0 0 0 .988-7.876 6.5 6.5 0 0 0-5.605-6.048Z" />
                            <path d="M12.707 9.293a1 1 0 0 0-1.414 0l-2 2a1 1 0 1 0 1.414 1.414l.293-.293V19a1 1 0 1 0 2 0v-6.586l.293.293a1 1 0 0 0 1.414-1.414l-2-2Z" />
                          </svg>
                        </span>
                      )}
                    </span>
                    {saveStatus === "saved" && (
                      <span className="inline-block animate-pulse">
                        <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="green" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm13.707-1.293a1 1 0 0 0-1.414-1.414L11 12.586l-1.793-1.793a1 1 0 0 0-1.414 1.414l2.5 2.5a1 1 0 0 0 1.414 0l4-4Z" clipRule="evenodd" />
                        </svg>

                      </span>
                    )}
                    {saveStatus === "error" && (
                      <span className="inline-block animate-pulse">
                        <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="red" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm7.707-3.707a1 1 0 0 0-1.414 1.414L10.586 12l-2.293 2.293a1 1 0 1 0 1.414 1.414L12 13.414l2.293 2.293a1 1 0 0 0 1.414-1.414L13.414 12l2.293-2.293a1 1 0 0 0-1.414-1.414L12 10.586 9.707 8.293Z" clipRule="evenodd" />
                        </svg>

                      </span>
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-sm text-gray-400">Aucune note sélectionnée</span>
            )}
          </div>

          <div className="flex-1 p-4 overflow-hidden">
            <TipTap editable={isEditable} onEditorUpdate={triggerAutoSave} />
          </div>
        </div>
      </div>

        <ShortcutOverlay
        visible={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  )
}