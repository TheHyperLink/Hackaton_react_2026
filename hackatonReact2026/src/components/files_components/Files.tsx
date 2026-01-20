
import { useState } from "react";
import type { FileNode } from "../../types/FileNode";
import type { NoteNode } from "../../types/NoteNode";
import { ContextMenu, type MenuItem } from "./ContextMenu";
import { InputDialog } from "./InputDialog";

type FileItemProps = {
  node: FileNode;
  depth?: number;
  onNoteClick?: (note: NoteNode) => void;
  onCreateFolder?: (parentFolderId: number, name: string) => void;
  onCreateNote?: (folderId: number, title: string) => void;
  onRenameFolder?: (folderId: number, newName: string) => void;
  onRenameNote?: (noteId: number, newTitle: string) => void;
  onDeleteFolder?: (folderId: number) => void;
  onDeleteNote?: (noteId: number) => void;
};

export function FileItem({
  node,
  depth = 0,
  onNoteClick,
  onCreateFolder,
  onCreateNote,
  onRenameFolder,
  onRenameNote,
  onDeleteFolder,
  onDeleteNote,
}: FileItemProps) {
  const [open, setOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [noteContextMenu, setNoteContextMenu] = useState<{
    x: number;
    y: number;
    note: NoteNode;
  } | null>(null);
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: "createFolder" | "createNote" | "renameFolder" | "renameNote";
    targetId?: number;
    defaultValue?: string;
  }>({
    isOpen: false,
    type: "createFolder",
  });

  const handleFolderContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleFolderMenuItems = (): MenuItem[] => [
    {
      label: "Créer un sous-dossier",
      icon: "🎃",
      action: () =>
        setDialogState({
          isOpen: true,
          type: "createFolder",
          targetId: node.id,
        }),
    },
    {
      label: "Créer une note",
      icon: "🗒️",
      action: () =>
        setDialogState({
          isOpen: true,
          type: "createNote",
          targetId: node.id,
        }),
    },
    {
      label: "Renommer le dossier",
      icon: "✏️",
      action: () =>
        setDialogState({
          isOpen: true,
          type: "renameFolder",
          targetId: node.id,
          defaultValue: node.name,
        }),
    },
    {
      label: "Supprimer le dossier",
      icon: "🗑️",
      isDanger: true,
      action: () => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer "${node.name}" ?`)) {
          onDeleteFolder?.(node.id);
        }
      },
    },
  ];

  const handleNoteMenuItems = (note: NoteNode): MenuItem[] => [
    {
      label: "Renommer la note",
      icon: "✏️",
      action: () =>
        setDialogState({
          isOpen: true,
          type: "renameNote",
          targetId: note.id,
          defaultValue: note.title,
        }),
    },
    {
      label: "Supprimer la note",
      icon: "🗑️",
      isDanger: true,
      action: () => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer "${note.title}" ?`)) {
          onDeleteNote?.(note.id);
        }
      },
    },
  ];

  const handleDialogConfirm = (value: string) => {
    const { type, targetId } = dialogState;
    switch (type) {
      case "createFolder":
        if (targetId !== undefined) {
          onCreateFolder?.(targetId, value);
        }
        break;
      case "createNote":
        if (targetId !== undefined) {
          onCreateNote?.(targetId, value);
        }
        break;
      case "renameFolder":
        if (targetId !== undefined) {
          onRenameFolder?.(targetId, value);
        }
        break;
      case "renameNote":
        if (targetId !== undefined) {
          onRenameNote?.(targetId, value);
        }
        break;
    }
    setDialogState({ isOpen: false, type: "createFolder" });
  };

  return (
    <>
      <div style={{ marginLeft: depth * 12 }}>
        {/* Bouton dossier */}
        <button
          onClick={() => setOpen(!open)}
          onContextMenu={handleFolderContextMenu}
          className={`
            w-full flex items-center gap-2
            px-2 py-1 rounded
            text-left
            hover:bg-violet-800/30
            hover:text-orange-400
            hover:cursor-pointer
            font-medium
          `}
        >
          <span className="text-1xl">{open ? "🕸️" : "🎃"}</span>
          <span
            className={
              "text-1xl " +
              (node.color === "red"
                ? "text-red-500"
                : node.color === "yellow"
                ? "text-yellow-400"
                : node.color === "green"
                ? "text-green-500"
                : node.color === "purple"
                ? "text-purple-400"
                : node.color === "pink"
                ? "text-pink-400"
                : "")
            }
          >
            {node.name}
          </span>
        </button>

        {/* Contenu du dossier ouvert */}
        {open && (
          <div className="mt-1">
            {/* Notes de ce dossier */}
            {node.notes &&
              node.notes.map((note: NoteNode) => (
                <div key={note.id} style={{ marginLeft: 12 }}>
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

            {/* Sous-dossiers récursifs */}
            {node.subFolders &&
              node.subFolders.map((sub: FileNode) => (
                <FileItem
                  key={sub.id}
                  node={sub}
                  depth={depth + 1}
                  onNoteClick={onNoteClick}
                  onCreateFolder={onCreateFolder}
                  onCreateNote={onCreateNote}
                  onRenameFolder={onRenameFolder}
                  onRenameNote={onRenameNote}
                  onDeleteFolder={onDeleteFolder}
                  onDeleteNote={onDeleteNote}
                />
              ))}
          </div>
        )}
      </div>

      {/* Context Menu pour le dossier */}
      {contextMenu && (
        <ContextMenu
          position={contextMenu}
          items={handleFolderMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Context Menu pour la note */}
      {noteContextMenu && (
        <ContextMenu
          position={noteContextMenu}
          items={handleNoteMenuItems(noteContextMenu.note)}
          onClose={() => setNoteContextMenu(null)}
        />
      )}

      {/* Dialog pour les inputs */}
      <InputDialog
        isOpen={dialogState.isOpen}
        title={
          dialogState.type === "createFolder"
            ? "Créer un nouveau dossier"
            : dialogState.type === "createNote"
            ? "Créer une nouvelle note"
            : dialogState.type === "renameFolder"
            ? "Renommer le dossier"
            : "Renommer la note"
        }
        placeholder={
          dialogState.type === "createFolder" || dialogState.type === "renameFolder"
            ? "Nom du dossier"
            : "Titre de la note"
        }
        defaultValue={dialogState.defaultValue || ""}
        onConfirm={handleDialogConfirm}
        onCancel={() =>
          setDialogState({ isOpen: false, type: "createFolder" })
        }
        type={
          dialogState.type === "createFolder" || dialogState.type === "createNote"
            ? "create"
            : "rename"
        }
      />
    </>
  );
}
