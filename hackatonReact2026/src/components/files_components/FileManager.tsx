export function FileManager() {
  return (
    <div className="border-t border-orange-500/40 p-2 flex gap-2 justify-between">
      {/* Bouton Créer */}
      <button className="flex-1 bg-yellow-700 hover:bg-yellow-600 text-white py-1 rounded text-sm hover:cursor-pointer">
        Créer
      </button>

      {/* Bouton Modifier */}
      <button className="flex-1 bg-purple-700 hover:bg-purple-600 text-white py-1 rounded text-sm hover:cursor-pointer">
        Modifier
      </button>

      {/* Bouton Supprimer */}
      <button className="flex-1 bg-red-700 hover:bg-red-600 text-white py-1 rounded text-sm hover:cursor-pointer">
        Supprimer
      </button>
    </div>
  )
}