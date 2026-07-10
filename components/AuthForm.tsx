"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "signup" ? { name, email, password } : { email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      {error && <div className="form-error">{error}</div>}
      {mode === "signup" && (
        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            placeholder="Your name"
          />
        </div>
      )}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder="At least 6 characters"
        />
      </div>
      <button className="btn" type="submit" disabled={busy} style={{ width: "100%" }}>
        {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
      </button>
    </form>
  );
}
