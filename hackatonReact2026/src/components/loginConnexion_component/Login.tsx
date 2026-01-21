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
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : "Erreur de connexion"
      );
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
            Se connecter
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
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
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    password: e.target.value,
                  })
                }
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded bg-black/40 border border-orange-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded bg-red-500/20 border border-red-500 text-red-300 text-sm">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>

            <button
              type="button"
              onClick={onSwitchToRegister}
              className="w-full px-4 py-2 text-sm text-gray-300 hover:text-orange-400 transition-colors"
            >
              Pas de compte ? S'inscrire
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
