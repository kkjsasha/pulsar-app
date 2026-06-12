"use client";
import PulsarStar from "../components/PulsarStar";
import Logo from "../components/Logo";

export default function LoginPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#04040a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", top: "50%", left: "50%", animation: "float 9s ease-in-out infinite", zIndex: 0, pointerEvents: "none" }}>
        <PulsarStar size={700} opacity={0.18} />
      </div>
      <div style={{ width: "100%", maxWidth: 420, padding: "48px 44px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, textAlign: "center", position: "relative", zIndex: 1, backdropFilter: "blur(40px)" }}>
        <div style={{ marginBottom: 32 }}><Logo size={22} /></div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 10 }}>Entrar na plataforma</h1>
        <p style={{ fontSize: 14, color: "rgba(240,240,248,0.38)", marginBottom: 40, lineHeight: 1.65 }}>Use sua conta Discord para acessar o painel e gerenciar seu servidor.</p>
        <button onClick={() => window.location.href = "http://localhost:3001/auth/discord"}
          style={{ width: "100%", padding: "14px", background: "#5865f2", border: "1px solid rgba(88,101,242,0.4)", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "'Inter', sans-serif", boxShadow: "0 4px 24px rgba(88,101,242,0.3)", transition: "all 0.2s" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 8px 32px rgba(88,101,242,0.5)"; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.boxShadow = "0 4px 24px rgba(88,101,242,0.3)"; }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.055a19.901 19.901 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
          </svg>
          Entrar com Discord
        </button>
        <p style={{ fontSize: 12, color: "rgba(240,240,248,0.18)", marginTop: 28, fontFamily: "'JetBrains Mono', monospace" }}>Ao entrar você concorda com nossos termos de uso.</p>
      </div>
    </main>
  );
}
