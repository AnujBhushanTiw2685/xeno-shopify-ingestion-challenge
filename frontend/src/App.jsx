import { useState } from "react";
import Dashboard from "./Dashboard";
import Login from "./Login";

function App() {
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  function handleLoginSuccess() {
    setLoggedIn(true);
  }

  return loggedIn ? (
    <Dashboard />
  ) : (
    <Login onLogin={handleLoginSuccess} />
  );
}

export default App;
