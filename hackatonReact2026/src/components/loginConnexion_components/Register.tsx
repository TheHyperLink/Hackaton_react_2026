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
      <div className="min-h-dvh flex items-center justify-center text-white">
        <div className="w-full max-w-md p-8 rounded-lg bg-black/60 backdrop-blur border border-orange-500/40">
          <h1 className="text-3xl font-bold text-center mb-2 text-orange-400">
            🎃 Bienvenue
          </h1>
          <p className="text-center text-sm text-gray-400 mb-8">
            Créer un nouveau compte
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-yellow-300">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    username: e.target.value,
                  })
                }
                placeholder="votre_pseudo"
                className="w-full px-4 py-2 rounded bg-black/40 border border-orange-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-yellow-300">
                Email
              </label>
              <input
                type="email"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    email: e.target.value,
                  })
                }
                placeholder="votre@email.com"
                className="w-full px-4 py-2 rounded bg-black/40 border border-orange-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-yellow-300">
                Mot de passe
              </label>
              <input
                type="password"
                value={credentials.passwordHash}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    passwordHash: e.target.value,
                  })
                }
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded bg-black/40 border border-orange-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            {registerError && (
              <div className="p-3 rounded bg-red-500/20 border border-red-500 text-red-300 text-sm">
                {registerError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Inscription..." : "S'inscrire"}
            </button>

            <button
              type="button"
              onClick={onSwitchToLogin}
              className="w-full px-4 py-2 text-sm text-gray-300 hover:text-orange-400 transition-colors"
            >
              Vous avez un compte ? Se connecter
            </button>
          </form>
        </div>
      </div>
    </>
  );
}