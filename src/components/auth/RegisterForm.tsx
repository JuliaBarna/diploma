"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ErrorBanner } from "./ErrorBanner";
import { PasswordInput } from "./PasswordInput";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const passwordMismatch = confirmPassword.length > 0 && confirmPassword !== password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Паролі не співпадають");
      return;
    }
    if (password.length < 8) {
      setError("Пароль має бути не менше 8 символів");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Помилка реєстрації");
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Помилка з'єднання з сервером");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      {/* Heading */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ color: "#f1f5f9", fontSize: "26px", fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>
          Створити акаунт
        </h1>
        <p style={{ color: "#64748b", fontSize: "14px", marginTop: "8px", lineHeight: "1.5" }}>
          Приєднайтесь до системи управління енергоресурсами
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Name */}
        <div>
          <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", marginBottom: "8px", fontWeight: 500 }}>
            Повне ім'я
          </label>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#475569", pointerEvents: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше ім'я"
              required
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              style={{
                width: "100%",
                background: "#0f1117",
                border: `1px solid ${nameFocused ? "#3b82f6" : "#1e2535"}`,
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
          <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", marginBottom: "8px", fontWeight: 500 }}>
            Пароль
          </label>
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="Мінімум 8 символів"
            required
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", marginBottom: "8px", fontWeight: 500 }}>
            Підтвердити пароль
          </label>
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Повторіть пароль"
            hasError={passwordMismatch}
            required
          />
          {passwordMismatch && (
            <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px" }}>
              Паролі не співпадають
            </p>
          )}
        </div>

        {/* Terms */}
        <p style={{ color: "#475569", fontSize: "12px", lineHeight: "1.5", margin: "2px 0" }}>
          Натискаючи «Створити акаунт», ви погоджуєтеся з{" "}
          <Link href="/terms" style={{ color: "#3b82f6", textDecoration: "none" }}>умовами використання</Link>
          {" "}та{" "}
          <Link href="/privacy" style={{ color: "#3b82f6", textDecoration: "none" }}>політикою конфіденційності</Link>.
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || passwordMismatch}
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "13px 20px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: loading || passwordMismatch ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            opacity: loading || passwordMismatch ? 0.6 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {loading ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Реєстрація...
            </>
          ) : (
            <>
              Створити акаунт
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div style={{ marginTop: "auto", paddingTop: "28px", textAlign: "center" }}>
        <span style={{ color: "#475569", fontSize: "13px" }}>
          Вже маєте акаунт?{" "}
          <Link href="/login" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}>
            Увійти
          </Link>
        </span>
      </div>
    </div>
  );
}
