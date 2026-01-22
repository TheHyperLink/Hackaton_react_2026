import { useState } from "react";
import { authService } from "../../services";
import HalloweenBackground from "../background/HalloweenBackground";

interface RegisterProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

export default function Register({onSwitchToLogin }: RegisterProps) {
  const [credentials, setCredentials] = useState({
    email: "",
    passwordHash: "",
    username: "",
  });
  const [registerError, setRegisterError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");

    if (!credentials.email || !credentials.username || !credentials.passwordHash) {
      setRegisterError("Veuillez remplir tous les champs");
      return;
    }

    if (credentials.passwordHash.length < 8) {
      setRegisterError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    try {
      setLoading(true);

      await authService.register({
        email: credentials.email,
        username: credentials.username,
        passwordHash: credentials.passwordHash,
      });
      setCredentials({ email: "", passwordHash: "", username: "" });
      onSwitchToLogin();
    } catch (error: any) {
      // Interprétation des erreurs API selon le code
      if (error && error.status) {
        /*switch (error.status) {
          case 400:
            setRegisterError("Requête invalide. Vérifiez les champs.");
            break;
          case 401:
            setRegisterError("Non autorisé.");
            break;
          case 403:
            setRegisterError("Accès refusé. Veuillez vérifier vos droits.");
            break;
          case 409:
            setRegisterError("Email ou nom d'utilisateur déjà utilisé.");
            break;
          case 500:
            setRegisterError("Erreur serveur. Réessayez plus tard.");
            break;
          default:
            setRegisterError("Erreur: " + (error.message || "Inscription impossible."));
        }*/

        setRegisterError("Erreur: " + (error.message));
      } 
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HalloweenBackground />
      <div className="min-h-dvh flex items-center justify-center">
        <form className="tombstone-form" onSubmit={handleRegister}>
          <h2>Inscription</h2>
          {registerError && <div className="error">{registerError}</div>}
          <label htmlFor="username">Nom d'utilisateur</label>
          <input
            id="username"
            type="text"
            value={credentials.username}
            onChange={e => setCredentials({ ...credentials, username: e.target.value })}
            placeholder="Nom d'utilisateur"
            autoComplete="username"
            required
          />
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={credentials.email}
            onChange={e => setCredentials({ ...credentials, email: e.target.value })}
            placeholder="Votre email"
            autoComplete="email"
            required
          />
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            value={credentials.passwordHash}
            onChange={e => setCredentials({ ...credentials, passwordHash: e.target.value })}
            placeholder="Mot de passe (min. 8 caractères)"
            autoComplete="new-password"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
          <span className="switch-link" onClick={onSwitchToLogin}>
            Déjà un compte ? Se connecter
          </span>
        </form>
      </div>
    </>
  );
}