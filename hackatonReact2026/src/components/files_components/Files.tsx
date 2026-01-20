
import { useState } from "react";
import type { FileNode } from "../../types/FileNode";
import type { NoteNode } from "../../types/NoteNode";

type FileItemProps = {
  node: FileNode;
  depth?: number;
  // AVANT : onNoteClick?: (content: string) => void;
  // APRÈS : on passe la note entière
  onNoteClick?: (note: NoteNode) => void;
};

export function FileItem({ node, depth = 0, onNoteClick }: FileItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginLeft: depth * 12 }}>
      {/* Bouton dossier */}
      <button
        onClick={() => setOpen(!open)}
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
          {node.notes && node.notes.map((note: NoteNode) => (
            <div key={note.id} style={{ marginLeft: 12 }}>
              <div
                className="flex items-center gap-2 px-2 py-1 text-yellow-500 hover:bg-yellow-900/30 hover:cursor-pointer rounded"
                // AVANT : onNoteClick && onNoteClick(note.content)
                // APRÈS : on envoie toute la note
                onClick={() => onNoteClick && onNoteClick(note)}
              >
                <span className="text-1xl">🗒️</span>
                <span className="text-1xl">{note.title}</span>
              </div>
            </div>
          ))}

          {/* Sous-dossiers récursifs */}
          {node.subFolders && node.subFolders.map((sub: FileNode) => (
            <FileItem
              key={sub.id}
              node={sub}
              depth={depth + 1}
              onNoteClick={onNoteClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
