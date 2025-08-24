import React from "react";

interface HeaderProps {
  isConnected: boolean;
  lastLoadedAt: number | null;
}

export function Header({ isConnected, lastLoadedAt }: HeaderProps) {
  const isStale = lastLoadedAt && Date.now() - lastLoadedAt > 60000;

  const statusText = isConnected
    ? isStale
      ? "stale"
      : "connected"
    : "disconnected";

  return (
    <header className="header">
      <h1 className="header-title">.gotn viewer</h1>
      <div className="status-indicator">
        <span
          className={`status-dot ${isConnected && !isStale ? "connected" : ""}`}
          aria-hidden="true"
        >
          ●
        </span>
        <span>{statusText}</span>
      </div>
    </header>
  );
}
