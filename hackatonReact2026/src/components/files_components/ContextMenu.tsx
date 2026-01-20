import React from "react";
import "../../style/ContextMenu.css";

export type MenuItem = {
  label: string;
  icon?: string;
  action: () => void;
  isDanger?: boolean;
};

type ContextMenuProps = {
  position: { x: number; y: number } | null;
  items: MenuItem[];
  onClose: () => void;
};

export function ContextMenu({ position, items, onClose }: ContextMenuProps) {
  React.useEffect(() => {
    const handleClickOutside = () => onClose();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  if (!position) return null;

  return (
    <div
      className="context-menu"
      style={{ top: position.y, left: position.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => (
        <button
          key={index}
          className={`context-menu-item ${item.isDanger ? "danger" : ""}`}
          onClick={() => {
            item.action();
            onClose();
          }}
        >
          {item.icon && <span className="icon">{item.icon}</span>}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
