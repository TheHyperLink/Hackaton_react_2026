import { useEffect, useState } from "react";
import "./App.css";
import UserNotes from "./components/UserNotes";
import HalloweenBackground from "./components/background/HalloweenBackground";
import Login from "./components/loginConnexion_components/Login";
import Register from "./components/loginConnexion_components/Register";
import { authService } from "./services";


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  // Vérifie la session côté serveur au chargement
  useEffect(() => {
    const check = async () => {
      const valid = await authService.checkSession();
      setIsLoggedIn(valid);
      setLoading(false);
    };
    check();
  }, []);

  // LOGOUT
  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
  };

  // LOADING SCREEN
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
    );
  }

  // LOGIN / REGISTER SCREEN
  if (!isLoggedIn) {
    if (isRegistering) {
      return (
        <Register
          onRegisterSuccess={() => setIsLoggedIn(true)}
          onSwitchToLogin={() => setIsRegistering(false)}
        />
      );
    }

    return (
      <Login
        onLoginSuccess={() => setIsLoggedIn(true)}
        onSwitchToRegister={() => setIsRegistering(true)}
      />
    );
  }

  // AUTHENTICATED SCREEN
  return (
    <>
      <HalloweenBackground />
      <div className="min-h-dvh text-white">
        <div className="flex justify-end p-4">
          <button
            onClick={handleLogout}
            className="px-2 py-2 rounded bg-red-600 hover:bg-red-500 hover:cursor-pointer text-white text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12H4m12 0-4 4m4-4-4-4m3-4h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2"/>
            </svg>

          </button>
        </div>
        <UserNotes />
      </div>
    </>
  );
}

export default App;