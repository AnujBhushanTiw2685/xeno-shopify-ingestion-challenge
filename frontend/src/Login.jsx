import { useState } from "react";
import api from "./api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("xeno1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const res = await api.post("/api/auth/login", { email, password });
      const token = res.data.token;
      if (!token) {
        setError("No token received from server");
        return;
      }
      localStorage.setItem("token", token);
      onLogin(); // tell App that login succeeded
    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "#020617",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "320px",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid #1f2937",
          background: "rgba(15, 23, 42, 0.95)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        <h2 style={{ fontSize: "20px", marginBottom: "4px" }}>Login</h2>
        <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "16px" }}>
          Enter your email and password to view the dashboard.
        </p>

        <label style={{ fontSize: "13px", color: "#e5e7eb" }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              marginTop: "4px",
              marginBottom: "12px",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "1px solid #334155",
              background: "#020617",
              color: "white",
              fontSize: "13px",
            }}
          />
        </label>

        <label style={{ fontSize: "13px", color: "#e5e7eb" }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              marginTop: "4px",
              marginBottom: "16px",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "1px solid #334155",
              background: "#020617",
              color: "white",
              fontSize: "13px",
            }}
          />
        </label>

        {error && (
          <div
            style={{
              marginBottom: "10px",
              fontSize: "13px",
              color: "tomato",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: "999px",
            border: "none",
            background: "#22c55e",
            color: "#020617",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
