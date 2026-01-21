import { useEffect, useState } from "react";
import "./App.css";
import UserNotes from "./components/UserNotes";
import HalloweenBackground from "./components/background/HalloweenBackground";
import Login from "./components/loginConnexion_component/Login";
import Register from "./components/loginConnexion_component/Register";
import { authService } from "./services";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  // Check cookie on load
  useEffect(() => {
    const hasJwtCookie = document.cookie.includes("jwt=");
    if (hasJwtCookie) {
      setIsLoggedIn(true);
    }
    setLoading(false);
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
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
          >
            Déconnexion
          </button>
        </div>
        <UserNotes />
      </div>
    </>
  );
}

export default App;