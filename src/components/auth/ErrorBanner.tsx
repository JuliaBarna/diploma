interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      style={{
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: "10px",
        padding: "12px 16px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" flexShrink={0}>
        <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" />
        <line x1="12" y1="8" x2="12" y2="12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1" fill="#ef4444" />
      </svg>
      <span style={{ color: "#ef4444", fontSize: "13px" }}>{message}</span>
    </div>
  );
}
