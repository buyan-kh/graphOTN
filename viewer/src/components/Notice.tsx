import React from "react";

interface NoticeProps {
  type: "error" | "warning" | "info";
  message: string;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Notice({ type, message, onDismiss, action }: NoticeProps) {
  return (
    <div className={`notice ${type}`} role="alert" aria-live="polite">
      <span>{message}</span>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {action && (
          <button onClick={action.onClick} type="button">
            {action.label}
          </button>
        )}

        {onDismiss && (
          <button onClick={onDismiss} aria-label="Dismiss notice" type="button">
            ×
          </button>
        )}
      </div>
    </div>
  );
}
