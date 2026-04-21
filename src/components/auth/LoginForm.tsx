"use client";

import { useState } from "react";
import Link from "next/link";
import { ErrorBanner } from "./ErrorBanner";
import { PasswordInput } from "./PasswordInput";
import { SocialButton } from "./SocialButton";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Невірний email або пароль");
        setLoading(false);
        return;
      }

      // Hard navigation — щоб cookie точно була встановлена до наступного запиту
      window.location.href = "/dashboard";
    } catch {
      setError("Помилка з'єднання з сервером");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      {/* Heading */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ color: "#f1f5f9", fontSize: "26px", fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>
          З поверненням
        </h1>
        <p style={{ color: "#64748b", fontSize: "14px", marginTop: "8px", lineHeight: "1.5" }}>
          Увійдіть до системи управління енергоресурсами
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Email */}
        <div>
          <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", marginBottom: "8px", fontWeight: 500 }}>
            Email
          </label>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#475569", pointerEvents: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              style={{
                width: "100%",
                background: "#0f1117",
                border: `1px solid ${emailFocused ? "#3b82f6" : "#1e2535"}`,
                borderRadius: "10px",
                padding: "12px 14px 12px 42px",
                color: "#f1f5f9",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <label style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>Пароль</label>
            <Link href="/forgot-password" style={{ color: "#3b82f6", fontSize: "13px", textDecoration: "none" }}>
              Забули пароль?
            </Link>
          </div>
          <PasswordInput value={password} onChange={setPassword} required />
        </div>

        {/* Remember me */}
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          <div
            onClick={() => setRememberMe((v) => !v)}
            role="checkbox"
            aria-checked={rememberMe}
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "5px",
              border: `2px solid ${rememberMe ? "#3b82f6" : "#1e2535"}`,
              background: rememberMe ? "#3b82f6" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.15s",
            }}
          >
            {rememberMe && (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span style={{ color: "#64748b", fontSize: "13px" }}>Запам&apos;ятати мене на 30 днів</span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "13px 20px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginTop: "4px",
            opacity: loading ? 0.7 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {loading ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Входимо...
            </>
          ) : (
            <>
              Увійти до системи
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
        <div style={{ flex: 1, height: "1px", background: "#1e2535" }} />
        <span style={{ color: "#475569", fontSize: "12px" }}>або</span>
        <div style={{ flex: 1, height: "1px", background: "#1e2535" }} />
      </div>

      <SocialButton />

      {/* Footer */}
      <div style={{ marginTop: "auto", paddingTop: "32px", textAlign: "center" }}>
        <span style={{ color: "#475569", fontSize: "13px" }}>
          Немає акаунту?{" "}
          <Link href="/register" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}>
            Зареєструватися
          </Link>
        </span>
      </div>
    </div>
  );
}