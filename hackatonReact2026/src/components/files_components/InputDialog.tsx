import React, { useState, useRef, useEffect } from "react";
import "../../style/InputDialog.css";

type FolderColor = "red" | "yellow" | "green" | "purple" | "pink";

type InputDialogProps = {
  isOpen: boolean;
  title: string;
  placeholder?: string;
  defaultValue?: string;
  defaultColor?: FolderColor;
  onConfirm: (value: string, color?: FolderColor) => void;
  onCancel: () => void;
  type?: "create" | "rename";
  isFolderDialog?: boolean;
};

// Liste des couleurs de dossier disponibles
const FOLDER_COLORS: { color: FolderColor; label: string }[] = [
  { color: "yellow", label: "Jaune" },
  { color: "red", label: "Rouge" },
  { color: "green", label: "Vert" },
  { color: "purple", label: "Violet" },
  { color: "pink", label: "Rose" },
];

// Retourne la couleur hexadécimale associée à un nom de couleur
const getColorValue = (color: FolderColor): string => {
  const colorMap: Record<FolderColor, string> = {
    yellow: "#fbbf24",
    red: "#ef4444",
    green: "#22c55e",
    purple: "#a855f7",
    pink: "#ec4899",
  };
  return colorMap[color];
};

export function InputDialog({
  isOpen,
  title,
  placeholder,
  defaultValue = "",
  defaultColor = "yellow",
  onConfirm,
  onCancel,
  type = "create",
  isFolderDialog = false,
}: InputDialogProps) {
  // Valeur du champ texte
  const [value, setValue] = useState(defaultValue);
  // Couleur sélectionnée pour le dossier
  const [selectedColor, setSelectedColor] = useState<FolderColor>(defaultColor);
  // Référence vers l'input pour focus/sélection
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(defaultValue);
    setSelectedColor(defaultColor);
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
      if (type === "rename" && defaultValue) {
        // Sélectionner le texte sauf l'extension pour les fichiers
        const dotIndex = defaultValue.lastIndexOf(".");
        if (dotIndex > 0) {
          inputRef.current.setSelectionRange(0, dotIndex);
        } else {
          inputRef.current.select();
        }
      }
    }
  }, [isOpen, defaultValue, defaultColor, type]);

  const handleConfirm = () => {
    if (value.trim()) {
      if (isFolderDialog) {
        onConfirm(value, selectedColor);
      } else {
        onConfirm(value);
      }
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="input-dialog-overlay">
      <div className="input-dialog">
        <h3>{title}</h3>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="input-field"
        />

        {/* Sélecteur de couleur pour les dossiers */}
        {isFolderDialog && (
          <div className="color-picker">
            <label>Couleur du dossier :</label>
            <div className="color-options">
              {FOLDER_COLORS.map(({ color, label }) => (
                <button
                  key={color}
                  className={`color-option ${selectedColor === color ? "selected" : ""}`}
                  onClick={() => setSelectedColor(color)}
                  title={label}
                  style={{ backgroundColor: getColorValue(color) }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="input-dialog-actions">
          <button onClick={handleConfirm} className="btn-confirm">
            Confirmer
          </button>
          <button onClick={onCancel} className="btn-cancel">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
