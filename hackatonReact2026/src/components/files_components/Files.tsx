

import { useState } from "react";
import type { FileNode } from "../../types/FileNode";
import type { NoteNode } from "../../types/NoteNode";


type FileItemProps = {
  node: FileNode;
  depth?: number;
  onNoteClick?: (content: string) => void;
};

export function FileItem({ node, depth = 0, onNoteClick }: FileItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginLeft: depth * 12 }}>
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
      {open && (
        <div className="mt-1">
          {/* Affiche les notes de ce dossier */}
          {node.notes && node.notes.map((note: NoteNode) => (
            <div key={note.id} style={{ marginLeft: 12 }}>
              <div
                className="flex items-center gap-2 px-2 py-1 text-yellow-500 hover:bg-yellow-900/30 hover:cursor-pointer rounded"
                onClick={() => onNoteClick && onNoteClick(note.content)}
              >
                <span className="text-1xl">🗒️</span>
                <span className="text-1xl">{note.title}</span>
              </div>
            </div>
          ))}
          {/* Affiche les sous-dossiers récursivement */}
          {node.subFolders && node.subFolders.map((sub: FileNode) => (
            <FileItem key={sub.id} node={sub} depth={depth + 1} onNoteClick={onNoteClick} />
          ))}
        </div>
      )}
    </div>
  );
}
