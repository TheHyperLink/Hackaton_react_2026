import type {FileNode} from "../../types/FileNode"
import { FileManager } from "./FileManager"
import { FileItem } from "./Files"


export function FileTree() {
    return (
        
        <div className="w-1/4 border-4 border-orange-500/25 rounded-2xl overflow-hidden">
          <FileManager />
            {data.map(node => (
                <FileItem key={node.id} node={node} />
            ))}
        </div>
    )}




export const data: FileNode[] = [
  {
    id: "1",
    name: "Cours",
    type: "folder",
    children: [
      { id: "1-1", name: "planning.md", type: "note" },
      { id: "1-2", name: "examens.md", type: "note" },

      {
        id: "1-3",
        name: "Frontend",
        type: "folder",
        children: [
          { id: "1-3-1", name: "intro_frontend.md", type: "note" },

          {
            id: "1-3-2",
            name: "Reactdqzdqzdqzdqzdqzdqzdqzdqzdqzdqzdqzdqzd",
            type: "folder",
            children: [
              { id: "1-3-2-1", name: "JSX.md", type: "note" },
              { id: "1-3-2-2", name: "useState.md", type: "note" },

              {
                id: "1-3-2-3",
                name: "Patterns",
                type: "folder",
                children: [
                  { id: "1-3-2-3-1", name: "Container_Presenter.md", type: "note" },
                  { id: "1-3-2-3-2", name: "CompoundComponents.md", type: "note" },
                ],
              },

              { id: "1-3-2-4", name: "notes_personnelles.md", type: "note" },
            ],
          },

          { id: "1-3-3", name: "Angular.md", type: "note" },
        ],
      },

      {
        id: "1-4",
        name: "Backend",
        type: "folder",
        children: [
          { id: "1-4-1", name: "intro_backend.md", type: "note" },

          {
            id: "1-4-2",
            name: "Spring Boot",
            type: "folder",
            children: [
              { id: "1-4-2-1", name: "controllers.md", type: "note" },
              { id: "1-4-2-2", name: "services.md", type: "note" },

              {
                id: "1-4-2-3",
                name: "Sécurité",
                type: "folder",
                children: [
                  { id: "1-4-2-3-1", name: "JWT.md", type: "note" },
                  { id: "1-4-2-3-2", name: "roles.md", type: "note" },
                ],
              },
            ],
          },

          { id: "1-4-3", name: "Docker.md", type: "note" },
        ],
      },
    ],
  },

  {
    id: "2",
    name: "Projets",
    type: "folder",
    children: [
      { id: "2-1", name: "README.md", type: "note" },

      {
        id: "2-2",
        name: "Notes App",
        type: "folder",
        children: [
          { id: "2-2-1", name: "roadmap.md", type: "note" },
          { id: "2-2-2", name: "architecture.md", type: "note" },

          {
            id: "2-2-3",
            name: "Frontend",
            type: "folder",
            children: [
              { id: "2-2-3-1", name: "App.tsx", type: "note" },
              { id: "2-2-3-2", name: "file_tree.tsx", type: "note" },
              { id: "2-2-3-3", name: "FileItem.tsx", type: "note" },
            ],
          },

          {
            id: "2-2-4",
            name: "Backend",
            type: "folder",
            children: [
              { id: "2-2-4-1", name: "entities.md", type: "note" },
              { id: "2-2-4-2", name: "repositories.md", type: "note" },
            ],
          },
        ],
      },
    ],
  },
]


