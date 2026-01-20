
import { useState } from "react"
import type { FileNode } from "../../types/FileNode"

type FileNodeProps = {
  node: FileNode
  depth?: number
}


export function FileItem({ node, depth = 0 }: FileNodeProps) {
  const [open, setOpen] = useState(false)

  const isFolder = node.type === "folder"

  return (
    <div style={{ marginLeft: depth * 12 }}>
      {/* Dossier ou note */}
      <button
        onClick={() => isFolder && setOpen(!open)}
        className={`
          w-full flex items-center gap-2
          px-2 py-1 rounded
          text-left
          hover:bg-violet-800/30
          hover:text-orange-400
          hover:cursor-pointer
          ${isFolder ? "font-medium" : "text-yellow-500"}
        `}
      >
        {isFolder ? (
          <span className="text-1xl">{open ? "🕸️" : "🎃"}</span>
        ) : (
          <span className="text-1xl">🗒️</span>
        )}

        <span className="text-1xl">{node.name}</span>
      </button>

      {/* Enfants */}
      {isFolder && open && node.children && (
        <div className="mt-1">
          {node.children.map((child) => (
            <div className="">
                <FileItem
                key={child.id}
                node={child}
                depth={depth + 1}
              />
            </div>
            
          ))}
        </div>
      )}
    </div>
  )
}
