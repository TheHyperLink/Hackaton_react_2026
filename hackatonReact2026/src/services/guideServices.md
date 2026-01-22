/**
 * 📚 Guide d'utilisation des Services API
 *
 * Tous les services sont disponibles et singleton (une seule instance)
 * Ils gèrent automatiquement le token d'authentification via localStorage
 */

// ==================== EXEMPLE D'UTILISATION ====================

// 1️⃣ AUTHENTIFICATION
// ────────────────────────────────────────────────────────────────

import { authService } from "./AuthService";

// Connexion
async function handleLogin(email: string, password: string) {
  try {
    const response = await authService.login({ email, password });
    // La réponse contient le token
    // authService.setToken(token) - le token est stocké automatiquement
    console.log("Connexion réussie", response);
  } catch (error) {
    console.error("Erreur de connexion", error);
  }
}

// Vérifier si l'utilisateur est authentifié
if (authService.isAuthenticated()) {
  console.log("L'utilisateur est connecté");
}

// Déconnexion
async function handleLogout() {
  await authService.logout();
  authService.clearToken();
}

// ==================== EXEMPLE D'UTILISATION ====================

// 2️⃣ DOSSIERS (Folders)
// ────────────────────────────────────────────────────────────────

import { folderService } from "./FolderService";

// Récupérer tous les dossiers de l'utilisateur
async function loadFolders() {
  try {
    const response = await folderService.getFolders();
    console.log("Dossiers:", response.folders);
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Créer un nouveau dossier
async function createNewFolder(name: string, color: string) {
  try {
    const folder = await folderService.createFolder({
      name,
      color,
      parentFolderId: null, // null pour la racine
    });
    console.log("Dossier créé:", folder);
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Créer un sous-dossier
async function createSubFolder(name: string, color: string, parentId: number) {
  try {
    const folder = await folderService.createFolder({
      name,
      color,
      parentFolderId: parentId,
    });
    console.log("Sous-dossier créé:", folder);
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Mettre à jour un dossier
async function updateFolder(id: number, name: string, color: string) {
  try {
    const folder = await folderService.updateFolder({
      id,
      name,
      color,
    });
    console.log("Dossier mis à jour:", folder);
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Supprimer un dossier
async function deleteFolder(id: number) {
  try {
    await folderService.deleteFolder(id);
    console.log("Dossier supprimé");
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// ==================== EXEMPLE D'UTILISATION ====================

// 3️⃣ NOTES
// ────────────────────────────────────────────────────────────────

import { noteService } from "./NoteService";

// Récupérer toutes les notes
async function loadNotes(folderId?: number, search?: string) {
  try {
    const response = await noteService.getNotes(folderId, search);
    console.log("Notes:", response.notes);
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Récupérer une note spécifique
async function loadNoteById(id: number) {
  try {
    const note = await noteService.getNoteById(id);
    console.log("Note:", note);
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Créer une nouvelle note
async function createNote(folderId: number, title: string, content: string) {
  try {
    const note = await noteService.createNote({
      folderId,
      title,
      content,
    });
    console.log("Note créée:", note);
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Mettre à jour une note
async function updateNote(id: number, title: string, content: string) {
  try {
    await noteService.updateNote({
      id,
      title,
      content,
    });
    console.log("Note mise à jour");
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Supprimer une note
async function deleteNote(id: number) {
  try {
    await noteService.deleteNote(id);
    console.log("Note supprimée");
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// ==================== EXEMPLE D'UTILISATION ====================

// 4️⃣ UTILISATEURS
// ────────────────────────────────────────────────────────────────

import { userService } from "./UserService";

// Récupérer l'utilisateur actuellement authentifié
async function getCurrentUserInfo() {
  try {
    const user = await userService.getCurrentUser();
    console.log("Utilisateur actuel:", user);
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Récupérer un utilisateur par ID
async function getUserInfo(id: number) {
  try {
    const user = await userService.getUserById(id);
    console.log("Utilisateur:", user);
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Créer un nouvel utilisateur
async function registerUser(username: string, email: string, passwordHash: string) {
  try {
    const user = await userService.createUser({
      username,
      email,
      passwordHash,
    });
    console.log("Utilisateur créé:", user);
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// ==================== CONFIGURATION ====================

// L'URL de base de l'API est définie dans ApiClient
// Par défaut: http://localhost:8080/api
// Ou via la variable d'environnement: REACT_APP_API_URL

// Variables d'environnement à créer dans .env:
// REACT_APP_API_URL=http://localhost:8080/api

// ==================== UTILISATION DANS LES COMPOSANTS ====================

// Dans un composant React:
// import { noteService, folderService } from "@/services";
// import { useEffect, useState } from "react";

// function MyComponent() {
//   const [notes, setNotes] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadNotes = async () => {
//       try {
//         const response = await noteService.getNotes();
//         setNotes(response.notes);
//       } catch (error) {
//         console.error("Erreur:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadNotes();
//   }, []);

//   if (loading) return <div>Chargement...</div>;

//   return (
//     <div>
//       {notes.map(note => (
//         <div key={note.id}>{note.title}</div>
//       ))}
//     </div>
//   );
// }
