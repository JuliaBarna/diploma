"use client";

import { useState } from "react";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  name?: string;
  required?: boolean;
}

export function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  hasError = false,
  name,
  required,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);

  const borderColor = hasError
    ? "#ef4444"
    : focused
    ? "#3b82f6"
    : "#1e2535";

  return (
    <div style={{ position: "relative" }}>
      {/* Lock icon */}
      <div
        style={{
          position: "absolute",
          left: "14px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "#475569",
          pointerEvents: "none",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: "#0f1117",
          border: `1px solid ${borderColor}`,
          borderRadius: "10px",
          padding: "12px 42px",
          color: "#f1f5f9",
          fontSize: "14px",
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.2s",
        }}
      />

      {/* Show/hide toggle */}
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        style={{
          position: "absolute",
          right: "14px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#475569",
          padding: 0,
          display: "flex",
          alignItems: "center",
        }}
        aria-label={show ? "Сховати пароль" : "Показати пароль"}
      >
        {show ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
