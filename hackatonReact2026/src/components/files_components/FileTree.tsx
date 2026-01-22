
import type { FileNode } from "../../types/FileNode"
import type { NoteNode } from "../../types/NoteNode"
import { FileItem } from "./Files"
import { ContextMenu, type MenuItem } from "./ContextMenu"
import { InputDialog } from "./InputDialog"
import { useState, useEffect } from "react"
import { folderService, noteService } from "../../services"

type FileTreeProps = {
  onNoteClick?: (note: NoteNode) => void;
  onReloadRequest?: (reloadFn: () => Promise<void>) => void;
};

export function FileTree({ onNoteClick, onReloadRequest }: FileTreeProps) {
  // Liste des dossiers affichés
  const [folderList, setFolderList] = useState<FileNode[]>([]);
  // Indique si les dossiers sont en cours de chargement
  const [loading, setLoading] = useState(true);
  // Message d'erreur éventuel
  const [error, setError] = useState<string | null>(null);
  // Position du menu contextuel racine
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  // Position du menu contextuel pour une note du root
  const [noteContextMenu, setNoteContextMenu] = useState<{
    x: number;
    y: number;
    note: NoteNode;
  } | null>(null);
  // État du dialog pour création dossier/note à la racine
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: "createFolder" | "createNote";
    defaultColor?: string;
  }>({
    isOpen: false,
    type: "createFolder",
  });
  // État du dialog pour renommer/supprimer une note du root
  const [noteDialogState, setNoteDialogState] = useState<{
    isOpen: boolean;
    type: "renameNote" | "deleteNote";
    targetNote?: NoteNode;
    defaultValue?: string;
  }>({
    isOpen: false,
    type: "renameNote",
  });

  // Recharge les dossiers depuis l'API
  const reloadFolders = async () => {
    try {
      setError(null);
      const response = await folderService.getFolders();
      const folders = response.folders.map(folder => convertFolderDetailToFileNode(folder));
      setFolderList(folders);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur lors du chargement des dossiers";
      setError(errorMsg);
      console.error("Erreur:", err);
    }
  };

  // Charger les dossiers au montage du composant
  useEffect(() => {
    const loadFolders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await folderService.getFolders();
        // Convertir FolderDetail[] en FileNode[]
        const folders = response.folders.map(folder => convertFolderDetailToFileNode(folder));
        setFolderList(folders);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erreur lors du chargement des dossiers";
        setError(errorMsg);
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    };

    loadFolders();
  }, []);

  // Exposer la fonction de rechargement au parent
  useEffect(() => {
    if (onReloadRequest) {
      onReloadRequest(reloadFolders);
    }
  }, [onReloadRequest]);

  // Fonction de conversion FolderDetail -> FileNode
  // Convertit un objet FolderDetail (API) en FileNode (UI)
  const convertFolderDetailToFileNode = (folderDetail: any): FileNode => {
    return {
      id: folderDetail.id,
      userId: folderDetail.userId,
      name: folderDetail.name,
      color: folderDetail.color,
      parentFolderId: folderDetail.parentFolderId,
      isRoot: folderDetail.isRoot || false,
      createdAt: folderDetail.createdAt,
      updatedAt: folderDetail.updatedAt,
      subFolders: Array.isArray(folderDetail.subFolders) && typeof folderDetail.subFolders[0] === "string" 
        ? [] 
        : folderDetail.subFolders || [],
      notes: folderDetail.notes || [],
    };
  };

  // Ouvre le menu contextuel sur la racine
  const handleRootContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Retourne le dossier racine
  const getRootFolder = (): FileNode | undefined => {
    return folderList.find(folder => folder.isRoot === true);
  };

  // Actions du menu contextuel racine
  const handleRootMenuItems = (): MenuItem[] => {
    const rootFolder = getRootFolder();
    const rootFolderId = rootFolder?.id;

    return [
      {
        label: "Créer un dossier à la racine",
        icon: "🎃",
        action: () =>
          setDialogState({
            isOpen: true,
            type: "createFolder",
            defaultColor: "yellow",
          }),
      },
      {
        label: "Créer une note à la racine",
        icon: "🗒️",
        action: () =>
          setDialogState({
            isOpen: true,
            type: "createNote",
          }),
      },
    ];
  };

  // Actions du menu contextuel pour une note du root
  const handleRootNoteMenuItems = (note: NoteNode): MenuItem[] => [
    {
      label: "Renommer la note",
      icon: "✏️",
      action: () =>
        setNoteDialogState({
          isOpen: true,
          type: "renameNote",
          targetNote: note,
          defaultValue: note.title,
        }),
    },
    {
      label: "Supprimer la note",
      icon: "🗑️",
      isDanger: true,
      action: () => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer "${note.title}" ?`)) {
          handleDeleteNote(note.id);
        }
      },
    },
  ];

  // Crée un dossier dans la structure locale et côté API
  const handleCreateFolder = async (parentFolderId: number, name: string, color: string = "yellow") => {
    try {
      const newFolderDetail = await folderService.createFolder({
        name,
        color,
        parentFolderId: parentFolderId || null,
      });
      
      // Convertir le résultat de l'API en FileNode
      const newFolder = convertFolderDetailToFileNode(newFolderDetail);

      // Mettre à jour la liste locale de manière récursive
      const addFolderRecursive = (folders: FileNode[]): FileNode[] =>
        folders.map(folder => {
          if (folder.id === parentFolderId) {
            // Trouver le dossier parent et ajouter le nouveau dossier
            return { ...folder, subFolders: [...(folder.subFolders || []), newFolder] };
          }
          if (folder.subFolders) {
            // Chercher dans les sous-dossiers de manière récursive
            return { ...folder, subFolders: addFolderRecursive(folder.subFolders) };
          }
          return folder;
        });

      setFolderList(prevFolders => addFolderRecursive(prevFolders));
    } catch (err) {
      console.error("Erreur lors de la création du dossier:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la création du dossier");
    }
  };

  // Crée une note dans la structure locale et côté API
  const handleCreateNote = async (folderId: number, title: string) => {
    try {
      const newNote = await noteService.createNote({
        folderId,
        title,
        content: "",
      });

      // Mettre à jour la liste locale
      setFolderList(prevFolders => {
        const updateFolderNotes = (folders: FileNode[]): FileNode[] =>
          folders.map(folder => {
            if (folder.id === folderId) {
              return { ...folder, notes: [...(folder.notes || []), newNote] };
            }
            if (folder.subFolders) {
              return {
                ...folder,
                subFolders: updateFolderNotes(folder.subFolders),
              };
            }
            return folder;
          });

        return updateFolderNotes(prevFolders);
      });
    } catch (err) {
      console.error("Erreur lors de la création de la note:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la création de la note");
    }
  };

  // Renomme un dossier (local + API)
  const handleRenameFolder = async (folderId: number, newName: string, newColor?: string) => {
    try {
      await folderService.updateFolder({
        id: folderId,
        name: newName,
        color: newColor || "yellow",
      });

      // Mettre à jour la liste locale
      const renameSubfolder = (subFolders: FileNode[] | undefined): FileNode[] | undefined => {
        if (!subFolders) return subFolders;
        return subFolders.map(sub =>
          sub.id === folderId
            ? {
                ...sub,
                name: newName,
                color: newColor || sub.color,
                subFolders: renameSubfolder(sub.subFolders),
              }
            : { ...sub, subFolders: renameSubfolder(sub.subFolders) }
        );
      };

      setFolderList(prevFolders =>
        prevFolders.map(folder =>
          folder.id === folderId
            ? { ...folder, name: newName, color: newColor || folder.color }
            : { ...folder, subFolders: renameSubfolder(folder.subFolders) }
        )
      );
    } catch (err) {
      console.error("Erreur lors du renommage du dossier:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du renommage du dossier");
    }
  };

  // Renomme une note (local + API)
  const handleRenameNote = async (noteId: number, newTitle: string) => {
    try {
      await noteService.updateNote({
        id: noteId,
        title: newTitle,
        content: "", // On ne change pas le contenu ici
      });

      // Mettre à jour la liste locale
      const renameNoteRecursive = (folder: FileNode): FileNode => ({
        ...folder,
        notes: folder.notes?.map(note =>
          note.id === noteId ? { ...note, title: newTitle } : note
        ),
        subFolders: folder.subFolders?.map(sub => renameNoteRecursive(sub)),
      });

      setFolderList(prevFolders =>
        prevFolders.map(folder => renameNoteRecursive(folder))
      );
    } catch (err) {
      console.error("Erreur lors du renommage de la note:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du renommage de la note");
    }
  };

  // Supprime un dossier (local + API)
  const handleDeleteFolder = async (folderId: number) => {
    try {
      await folderService.deleteFolder(folderId);

      // Mettre à jour la liste locale
      const deleteSubfolder = (subFolders: FileNode[] | undefined): FileNode[] | undefined => {
        if (!subFolders) return subFolders;
        return subFolders
          .filter(sub => sub.id !== folderId)
          .map(sub => ({
            ...sub,
            subFolders: deleteSubfolder(sub.subFolders),
          }));
      };

      setFolderList(prevFolders =>
        prevFolders
          .filter(folder => folder.id !== folderId)
          .map(folder => ({
            ...folder,
            subFolders: deleteSubfolder(folder.subFolders),
          }))
      );

      // Rafraîchir la page après suppression
      window.location.reload();
    } catch (err) {
      console.error("Erreur lors de la suppression du dossier:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression du dossier");
    }
  };

  // Supprime une note (local + API)
  const handleDeleteNote = async (noteId: number) => {
    try {
      await noteService.deleteNote(noteId);

      // Mettre à jour la liste locale
      const deleteNoteRecursive = (folder: FileNode): FileNode => ({
        ...folder,
        notes: folder.notes?.filter(note => note.id !== noteId),
        subFolders: folder.subFolders?.map(sub => deleteNoteRecursive(sub)),
      });

      setFolderList(prevFolders =>
        prevFolders.map(folder => deleteNoteRecursive(folder))
      );

      // Rafraîchir la page après suppression
      window.location.reload();
    } catch (err) {
      console.error("Erreur lors de la suppression de la note:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression de la note");
    }
  };

  // Gère la validation du dialog racine (création dossier/note)
  const handleDialogConfirm = async (value: string, color?: string) => {
    const { type } = dialogState;
    const rootFolder = getRootFolder();
    const rootFolderId = rootFolder?.id;

    try {
      switch (type) {
        case "createFolder":
          // Créer un nouveau dossier dans le dossier Root
          if (rootFolderId) {
            const newRootFolderDetail = await folderService.createFolder({
              name: value,
              color: color || "yellow",
              parentFolderId: rootFolderId,
            });
            const newRootFolder = convertFolderDetailToFileNode(newRootFolderDetail);
            
            // Mettre à jour la liste locale
            setFolderList(prev =>
              prev.map(folder =>
                folder.id === rootFolderId
                  ? { ...folder, subFolders: [...(folder.subFolders || []), newRootFolder] }
                  : folder
              )
            );
          }
          break;

        case "createNote":
          if (rootFolderId) {
            await handleCreateNote(rootFolderId, value);
          }
          break;
      }
    } catch (err) {
      console.error("Erreur:", err);
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    }

    setDialogState({ isOpen: false, type: "createFolder" });
  };

  // Gère la validation du dialog pour renommer une note du root
  const handleNoteDialogConfirm = async (value: string) => {
    const { type, targetNote } = noteDialogState;

    try {
      switch (type) {
        case "renameNote":
          if (targetNote) {
            await handleRenameNote(targetNote.id, value);
          }
          break;
      }
    } catch (err) {
      console.error("Erreur:", err);
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    }

    setNoteDialogState({ isOpen: false, type: "renameNote" });
  };

  if (loading) {
    return (
      <div className="w-1/4 border-4 border-orange-500/25 rounded-2xl overflow-hidden p-4 text-center">
        <p className="text-yellow-400">Chargement des dossiers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-1/4 border-4 border-orange-500/25 rounded-2xl overflow-hidden p-4">
        <p className="text-red-500">Erreur: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-2 py-1 bg-yellow-700 hover:bg-yellow-600 text-white rounded text-sm"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className="w-1/4 border-4 border-orange-500/25 rounded-2xl overflow-hidden"
        onContextMenu={handleRootContextMenu}
      >
        {(() => {
          // Trouver le dossier Root
          const rootFolder = getRootFolder();
          
          // Si pas de Root folder, afficher le message
          if (!rootFolder) {
            return (
              <div className="p-4 text-center text-yellow-500">
                Aucun dossier. Clic droit pour créer.
              </div>
            );
          }

          // Récupérer les enfants du Root (subFolders et notes)
          const rootChildren = rootFolder.subFolders || [];
          const rootNotes = rootFolder.notes || [];
          
          // Si le Root n'a pas d'enfants
          if (rootChildren.length === 0 && rootNotes.length === 0) {
            return (
              <div className="p-4 text-center text-yellow-500">
                Aucun dossier. Clic droit pour créer.
              </div>
            );
          }

          return (
            <div>
              {/* Afficher les notes du Root */}
              {rootNotes.map((note: NoteNode) => (
                <div key={note.id}>
                  <div
                    className="flex items-center gap-2 px-2 py-1 text-yellow-500 hover:bg-yellow-900/30 hover:cursor-pointer rounded"
                    onClick={() => onNoteClick && onNoteClick(note)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setNoteContextMenu({ x: e.clientX, y: e.clientY, note });
                    }}
                  >
                    <span className="text-1xl">🗒️</span>
                    <span className="text-1xl">{note.title}</span>
                  </div>
                </div>
              ))}

              {/* Afficher les enfants du Root (dossiers) */}
              {rootChildren.map(folder => (
                <FileItem
                  key={folder.id}
                  node={folder}
                  onNoteClick={onNoteClick}
                  onCreateFolder={handleCreateFolder}
                  onCreateNote={handleCreateNote}
                  onRenameFolder={handleRenameFolder}
                  onRenameNote={handleRenameNote}
                  onDeleteFolder={handleDeleteFolder}
                  onDeleteNote={handleDeleteNote}
                />
              ))}
            </div>
          );
        })()}
      </div>

      {/* Context Menu pour la racine */}
      {contextMenu && (
        <ContextMenu
          position={contextMenu}
          items={handleRootMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Context Menu pour les notes du Root */}
      {noteContextMenu && (
        <ContextMenu
          position={{ x: noteContextMenu.x, y: noteContextMenu.y }}
          items={handleRootNoteMenuItems(noteContextMenu.note)}
          onClose={() => setNoteContextMenu(null)}
        />
      )}

      {/* Dialog pour les inputs à la racine */}
      <InputDialog
        isOpen={dialogState.isOpen}
        title={
          dialogState.type === "createFolder"
            ? "Créer un nouveau dossier"
            : "Créer une nouvelle note"
        }
        placeholder={
          dialogState.type === "createFolder"
            ? "Nom du dossier"
            : "Titre de la note"
        }
        defaultColor={(dialogState.defaultColor as "red" | "yellow" | "green" | "purple" | "pink") || "yellow"}
        isFolderDialog={dialogState.type === "createFolder"}
        onConfirm={handleDialogConfirm}
        onCancel={() =>
          setDialogState({ isOpen: false, type: "createFolder" })
        }
        type="create"
      />

      {/* Dialog pour renommer les notes du Root */}
      <InputDialog
        isOpen={noteDialogState.isOpen}
        title="Renommer la note"
        placeholder="Nouveau titre"
        defaultValue={noteDialogState.defaultValue}
        isFolderDialog={false}
        onConfirm={handleNoteDialogConfirm}
        onCancel={() =>
          setNoteDialogState({ isOpen: false, type: "renameNote" })
        }
        type="create"
      />
    </>
  );
}
