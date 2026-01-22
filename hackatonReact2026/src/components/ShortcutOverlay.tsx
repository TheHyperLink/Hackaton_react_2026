import React from "react";

export default function ShortcutOverlay({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-[#1e1e1e] text-white p-6 rounded-lg shadow-xl w-[700px] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-orange-400">
            Raccourcis clavier
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Table */}
        <table className="w-full text-left text-sm">
          <tbody>
            {/* Gestion des notes */}
            <ShortcutGroup title="🗂️ Gestion des notes">
              <Shortcut label="Nouvelle note" keys="Ctrl + Alt + N" />
              <Shortcut label="Nouveau dossier" keys="Ctrl + Shift + M" />
              <Shortcut label="Dupliquer la note" keys="Ctrl + D" />
              <Shortcut label="Supprimer la note" keys="Delete" />
              <Shortcut label="Renommer" keys="F2" />
            </ShortcutGroup>

            {/* Export */}
            <ShortcutGroup title="📤 Export">
              <Shortcut label="Exporter en PDF" keys="Ctrl + P" />
              <Shortcut label="Exporter en ZIP" keys="Ctrl + Shift + P" />
            </ShortcutGroup>

            {/* Edition */}
            <ShortcutGroup title="✏️ Édition">
              <Shortcut label="Basculer Écriture/Lecture" keys="Ctrl + E" />
              <Shortcut label="Gras" keys="Ctrl + B" />
              <Shortcut label="Italique" keys="Ctrl + I" />
              <Shortcut label="Souligné" keys="Ctrl + U" />
              <Shortcut label="Barré" keys="Ctrl + Shift + X" />
              <Shortcut label="Bloc de code" keys="Ctrl + Alt + C" />
              <Shortcut label="Liste à puces" keys="Ctrl + Shift + 8" />
              <Shortcut label="Liste numérotée" keys="Ctrl + Shift + 7" />
            </ShortcutGroup>

            {/* Aide */}
            <ShortcutGroup title="❓ Aide">
              <Shortcut label="Afficher les raccourcis" keys="F1" />
            </ShortcutGroup>
          </tbody>
        </table>

        {/* Footer */}
        <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-600">
          ℹ️ Les raccourcis de texte (gras, italique, etc.) fonctionnent
          uniquement lors de l'édition d'une note.
        </p>
      </div>
    </div>
  );
}

function ShortcutGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <tr className="bg-gray-800/50">
        <td
          colSpan={2}
          className="py-2 px-2 font-bold text-orange-300 text-xs uppercase tracking-wider"
        >
          {title}
        </td>
      </tr>
      {children}
    </>
  );
}

function Shortcut({ label, keys }: { label: string; keys: string }) {
  return (
    <tr className="border-b border-white/10 hover:bg-gray-800/30 transition">
      <td className="py-2 px-2">{label}</td>
      <td className="py-2 px-2 text-right">
        <kbd className="px-2 py-1 bg-gray-700/50 border border-gray-600 rounded text-xs font-mono text-orange-300">
          {keys}
        </kbd>
      </td>
    </tr>
  );
}
