
import type { FileNode } from "../../types/FileNode"
import type { NoteNode } from "../../types/NoteNode"
import { FileItem } from "./Files"
import { ContextMenu, type MenuItem } from "./ContextMenu"
import { InputDialog } from "./InputDialog"
import { useState } from "react"





// Exemple complet et profond pour tests


type FileTreeProps = {
  onNoteClick?: (note: NoteNode) => void;
};


const folders: FileNode[] = [
  {
    id: 1,
    userId: 1,
    name: "Dossier1",
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
  const [folderList, setFolderList] = useState(folders);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: "createFolder" | "createNote";
  }>({
    isOpen: false,
    type: "createFolder",
  });

  const handleRootContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleRootMenuItems = (): MenuItem[] => [
    {
      label: "Créer un dossier à la racine",
      icon: "🎃",
      action: () =>
        setDialogState({
          isOpen: true,
          type: "createFolder",
        }),
    },
  ];

  const handleCreateFolder = (parentFolderId: number, name: string) => {
    const newFolder: FileNode = {
      id: Math.max(...folderList.flatMap(f => [f.id, ...(f.subFolders?.map(s => s.id) ?? [])]), 0) + 1,
      userId: 1,
      name,
      color: "yellow",
      parentFolderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: [],
      subFolders: [],
    };

    setFolderList(prevFolders => {
      // Vérifier si c'est une création à la racine (pas de parentFolderId ou parentFolderId n'existe pas)
      const isRootCreation = prevFolders.some(f => f.parentFolderId === null && f.id === parentFolderId) === false || 
                            parentFolderId === null;
      
      if (isRootCreation) {
        // Créer un nouveau dossier à la racine
        return [...prevFolders, { ...newFolder, parentFolderId: null }];
      } else {
        // Créer un sous-dossier
        return prevFolders.map(folder =>
          folder.id === parentFolderId
            ? { ...folder, subFolders: [...(folder.subFolders || []), newFolder] }
            : folder
        );
      }
    });
  };

  const handleCreateNote = (folderId: number, title: string) => {
    const newNote: NoteNode = {
      id: Math.max(...folderList.flatMap(f => f.notes?.map(n => n.id) ?? []), 0) + 1,
      userId: 1,
      folderId,
      title,
      content: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setFolderList(prevFolders => {
      // Vérifier si c'est une création à la racine
      const isRootCreation = prevFolders.some(f => f.id === folderId && f.parentFolderId === null);
      
      if (isRootCreation) {
        // Créer une note dans le dossier racine
        return prevFolders.map(folder =>
          folder.id === folderId
            ? { ...folder, notes: [...(folder.notes || []), newNote] }
            : folder
        );
      } else {
        // Créer une note dans un sous-dossier
        return prevFolders.map(folder => ({
          ...folder,
          subFolders: folder.subFolders?.map(sub =>
            sub.id === folderId
              ? { ...sub, notes: [...(sub.notes || []), newNote] }
              : sub
          ),
          notes: folder.id === folderId 
            ? [...(folder.notes || []), newNote]
            : folder.notes,
        }));
      }
    });
  };

  const handleRenameFolder = (folderId: number, newName: string) => {
    const renameSubfolder = (subFolders: FileNode[] | undefined): FileNode[] | undefined => {
      if (!subFolders) return subFolders;
      return subFolders.map(sub =>
        sub.id === folderId
          ? { ...sub, name: newName, subFolders: renameSubfolder(sub.subFolders) }
          : { ...sub, subFolders: renameSubfolder(sub.subFolders) }
      );
    };

    setFolderList(prevFolders =>
      prevFolders.map(folder =>
        folder.id === folderId
          ? { ...folder, name: newName }
          : { ...folder, subFolders: renameSubfolder(folder.subFolders) }
      )
    );
  };

  const handleRenameNote = (noteId: number, newTitle: string) => {
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
  };

  const handleDeleteFolder = (folderId: number) => {
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
  };

  const handleDeleteNote = (noteId: number) => {
    const deleteNoteRecursive = (folder: FileNode): FileNode => ({
      ...folder,
      notes: folder.notes?.filter(note => note.id !== noteId),
      subFolders: folder.subFolders?.map(sub => deleteNoteRecursive(sub)),
    });

    setFolderList(prevFolders =>
      prevFolders.map(folder => deleteNoteRecursive(folder))
    );
  };

  const handleDialogConfirm = (value: string) => {
    const { type } = dialogState;
    const rootFolderId = folderList[0]?.id;

    if (rootFolderId) {
      switch (type) {
        case "createFolder":
          // Créer un nouveau dossier à la racine (parentFolderId = null)
          const newRootFolder: FileNode = {
            id: Math.max(...folderList.flatMap(f => [f.id, ...(f.subFolders?.map(s => s.id) ?? [])]), 0) + 1,
            userId: 1,
            name: value,
            color: "yellow",
            parentFolderId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: [],
            subFolders: [],
          };
          setFolderList(prev => [...prev, newRootFolder]);
          break;
        case "createNote":
          handleCreateNote(rootFolderId, value);
          break;
      }
    }
    setDialogState({ isOpen: false, type: "createFolder" });
  };

  return (
    <>
      <div className="w-1/4 border-4 border-orange-500/25 rounded-2xl overflow-hidden" onContextMenu={handleRootContextMenu}>
        {folderList.map(folder => (
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

      {/* Context Menu pour la racine */}
      {contextMenu && (
        <ContextMenu
          position={contextMenu}
          items={handleRootMenuItems()}
          onClose={() => setContextMenu(null)}
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
        onConfirm={handleDialogConfirm}
        onCancel={() =>
          setDialogState({ isOpen: false, type: "createFolder" })
        }
        type="create"
      />
    </>
  );
}





