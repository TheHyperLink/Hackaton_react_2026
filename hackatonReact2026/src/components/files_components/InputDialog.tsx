import React, { useState, useRef, useEffect } from "react";
import "../../style/InputDialog.css";

type InputDialogProps = {
  isOpen: boolean;
  title: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  type?: "create" | "rename";
};

export function InputDialog({
  isOpen,
  title,
  placeholder,
  defaultValue = "",
  onConfirm,
  onCancel,
  type = "create",
}: InputDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(defaultValue);
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
  }, [isOpen, defaultValue, type]);

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value);
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
