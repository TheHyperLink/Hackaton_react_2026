import { useState } from "react";
import { authService } from "../../services";
import HalloweenBackground from "../background/HalloweenBackground";

interface LoginProps {
  onLoginSuccess: () => void;
  onSwitchToRegister: () => void;
}

export default function Login({ onLoginSuccess, onSwitchToRegister }: LoginProps) {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!credentials.email || !credentials.password) {
      setLoginError("Veuillez remplir tous les champs");
      return;
    }

    try {
      setLoading(true);
      await authService.login({
        email: credentials.email,
        password: credentials.password,
      });
      setCredentials({ email: "", password: "" });
      // Vérifie la session côté serveur pour garantir la connexion
      const valid = await authService.checkSession();
      if (valid) {
        onLoginSuccess();
      } else {
        setLoginError("Erreur de session après connexion");
      }
    } catch (error: any) {
      // Interprétation des erreurs API selon le code
      if (error && error.status) {
        /*switch (error.status) {
          case 400:
            setLoginError("Requête invalide. Vérifiez les champs.");
            break;
          case 401:
            setLoginError("Identifiants incorrects ou non autorisé.");
            break;
          case 403:
            setLoginError("Accès refusé. Veuillez vérifier vos droits.");
            break;
          case 404:
            setLoginError("Utilisateur non trouvé.");
            break;
          case 500:
            setLoginError("Erreur serveur. Réessayez plus tard.");
            break;
          default:
            setLoginError("Erreur: " + (error.message || "Connexion impossible."));
            
        }*/
       setLoginError("Erreur: " + (error.message));
      } 
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HalloweenBackground />
      <div className="min-h-dvh flex items-center justify-center">
        <form className="tombstone-form" onSubmit={handleLogin}>
          <h2>Connexion</h2>
          {loginError && <div className="error">{loginError}</div>}
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
            value={credentials.password}
            onChange={e => setCredentials({ ...credentials, password: e.target.value })}
            placeholder="Mot de passe"
            autoComplete="current-password"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
          <span className="switch-link" onClick={onSwitchToRegister}>
            Pas encore de compte ? S'inscrire
          </span>
        </form>
      </div>
    </>
  );
}