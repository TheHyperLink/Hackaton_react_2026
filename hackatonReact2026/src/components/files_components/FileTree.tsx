
import type { FileNode } from "../../types/FileNode"
import type { NoteNode } from "../../types/NoteNode"
import { FileManager } from "./FileManager"
import { FileItem } from "./Files"





// Exemple complet et profond pour tests


type FileTreeProps = {
  onNoteClick?: (note: NoteNode) => void;
};


const folders: FileNode[] = [
  {
    id: 1,
    userId: 1,
    name: "Racine",
    color: "yellow",
    parentFolderId: null,
    createdAt: "2026-01-20T10:00:00",
    updatedAt: "2026-01-20T10:00:00",
    notes: [
      {
        id: 1,
        userId: 1,
        folderId: 1,
        title: "README.md",
        content: "Bienvenue dans le dossier racine!",
        createdAt: "2026-01-20T10:01:00",
        updatedAt: "2026-01-20T10:01:00"
      },
      {
        id: 2,
        userId: 1,
        folderId: 1,
        title: "todo.md",
        content: "- [ ] Faire le café\n- [x] Coder l'explorateur",
        createdAt: "2026-01-20T10:02:00",
        updatedAt: "2026-01-20T10:02:00"
      }
    ],
    subFolders: [
      {
        id: 2,
        userId: 1,
        name: "Frontend",
        color: "purple",
        parentFolderId: 1,
        createdAt: "2026-01-20T10:10:00",
        updatedAt: "2026-01-20T10:10:00",
        notes: [
          {
            id: 3,
            userId: 1,
            folderId: 2,
            title: "index.tsx",
            content: "import React from 'react';",
            createdAt: "2026-01-20T10:11:00",
            updatedAt: "2026-01-20T10:11:00"
          }
        ],
        subFolders: [
          {
            id: 3,
            userId: 1,
            name: "Components",
            color: "green",
            parentFolderId: 2,
            createdAt: "2026-01-20T10:20:00",
            updatedAt: "2026-01-20T10:20:00",
            notes: [
              {
                id: 4,
                userId: 1,
                folderId: 3,
                title: "Button.tsx",
                content: "export const Button = () => <button>Click</button>;",
                createdAt: "2026-01-20T10:21:00",
                updatedAt: "2026-01-20T10:21:00"
              }
            ],
            subFolders: []
          }
        ]
      },
      {
        id: 4,
        userId: 1,
        name: "Backend",
        color: "red",
        parentFolderId: 1,
        createdAt: "2026-01-20T10:30:00",
        updatedAt: "2026-01-20T10:30:00",
        notes: [
          {
            id: 5,
            userId: 1,
            folderId: 4,
            title: "server.js",
            content: "const express = require('express');",
            createdAt: "2026-01-20T10:31:00",
            updatedAt: "2026-01-20T10:31:00"
          }
        ],
        subFolders: [
          {
            id: 5,
            userId: 1,
            name: "Models",
            color: "pink",
            parentFolderId: 4,
            createdAt: "2026-01-20T10:40:00",
            updatedAt: "2026-01-20T10:40:00",
            notes: [
              {
                id: 6,
                userId: 1,
                folderId: 5,
                title: "User.js",
                content: "module.exports = { name: 'User' }",
                createdAt: "2026-01-20T10:41:00",
                updatedAt: "2026-01-20T10:41:00"
              }
            ],
            subFolders: []
          },
          {
            id: 6,
            userId: 1,
            name: "Controllers",
            color: "green",
            parentFolderId: 4,
            createdAt: "2026-01-20T10:50:00",
            updatedAt: "2026-01-20T10:50:00",
            notes: [],
            subFolders: []
          }
        ]
      }
    ]
  }
];

export function FileTree({ onNoteClick }: FileTreeProps) {
  return (
    <div className="w-1/4 border-4 border-orange-500/25 rounded-2xl overflow-hidden">
      <FileManager />
      {folders.map(folder => (
        <FileItem key={folder.id} node={folder} onNoteClick={onNoteClick} />
      ))}
    </div>
  );
}





