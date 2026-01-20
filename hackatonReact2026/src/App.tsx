import { useEffect, useState } from 'react'
import './App.css'
import UserNotes from './components/UserNotes'
import HalloweenBackground from "./components/background/HalloweenBackground"
import { authService } from './services'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loginError, setLoginError] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  const [credentials, setCredentials] = useState({ email: "", passwordHash: "", username: "" })
  const [credentialsLogin, setCredentialsLogin] = useState({ email: "", password: "", username: "" })

  // Vérifier si un cookie JWT existe déjà
  useEffect(() => {
    const hasJwtCookie = document.cookie.includes("jwt=");
    if (hasJwtCookie) {
      setIsLoggedIn(true)
    }
    setLoading(false)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    
    if (!credentials.email || !credentials.passwordHash) {
      setLoginError("Veuillez remplir tous les champs")
      return
    }

    try {
      setLoading(true)
      await authService.login(credentialsLogin)
      setIsLoggedIn(true)
      setCredentialsLogin({ email: "", password: "", username: "" })
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    
    if (!credentialsLogin.email || !credentialsLogin.password || !credentialsLogin.username) {
      setLoginError("Veuillez remplir tous les champs")
      return
    }

    if (credentialsLogin.password.length < 8) {
      setLoginError("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    try {
      setLoading(true)
      await authService.register(credentials)
      setIsLoggedIn(true)
      setCredentials({ email: "", passwordHash: "", username: "" })
      setIsRegistering(false)
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Erreur lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    authService.logout()
    setIsLoggedIn(false)
    setCredentialsLogin({ email: "", password: "", username: "" })
  }

  if (loading) {
    return (
      <>
        <HalloweenBackground />
        <div className="min-h-dvh flex items-center justify-center text-white">
          <div className="text-center">
            <div className="inline-block animate-spin">🎃</div>
            <p className="mt-4">Chargement...</p>
          </div>
        </div>
      </>
    )
  }

  if (!isLoggedIn) {
    return (
      <>
        <HalloweenBackground />
        <div className="min-h-dvh flex items-center justify-center text-white">
          <div className="w-full max-w-md p-8 rounded-lg bg-black/60 backdrop-blur border border-orange-500/40">
            <h1 className="text-3xl font-bold text-center mb-2 text-orange-400">
              🎃 Bienvenue
            </h1>
            <p className="text-center text-sm text-gray-400 mb-8">
              {isRegistering ? "Créer un nouveau compte" : "Se connecter"}
            </p>
            
            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
              {isRegistering && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-yellow-300">
                    Nom d'utilisateur
                  </label>
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    placeholder="votre_pseudo"
                    className="w-full px-4 py-2 rounded bg-black/40 border border-orange-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-yellow-300">
                  Email
                </label>
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
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
                  onChange={(e) => setCredentials({ ...credentials, passwordHash: e.target.value })}
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
                {loading ? (isRegistering ? "Inscription..." : "Connexion...") : (isRegistering ? "S'inscrire" : "Se connecter")}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering)
                  setLoginError("")
                  setCredentials({ email: "", passwordHash: "", username: "" })
                }}
                className="w-full px-4 py-2 text-sm text-gray-300 hover:text-orange-400 transition-colors"
              >
                {isRegistering ? "Vous avez un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
              </button>
            </form>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <HalloweenBackground />
      <div className="min-h-dvh text-white">
        <div className="flex justify-end p-4">
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
          >
            Déconnexion
          </button>
        </div>
        <UserNotes />
      </div>
    </>
  )
}

export default App
