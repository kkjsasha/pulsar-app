"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "../components/Logo";

interface BotInfo {
  bot_id: string;
  bot_username: string;
  bot_avatar: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [token, setToken] = useState("");
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/auth/me", { credentials: "include" })
      .then(res => { if (!res.ok) throw new Error(); })
      .catch(() => router.push("/login"));
  }, []);

  const validate = async () => {
    if (!token.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/bots/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Token inválido.");
      setBotInfo(data);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Erro ao validar token.");
    } finally {
      setLoading(false);
    }
  };

  const connect = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/bots/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao conectar bot.");
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Erro ao conectar bot.");
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ["Token", "Confirmar", "Concluído"];

  return (
    <main style={{ minHeight: "100vh", background: "#04040a", color: "#f0f0f8", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <nav style={{ padding: "0 48px", height: 64, display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Logo size={18} />
      </nav>

      <div style={{ maxWidth: 520, margin: "72px auto", padding: "0 24px" }}>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 52 }}>
          {[1, 2, 3].map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                  background: step > s ? "rgba(124,58,237,0.25)" : step === s ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${step >= s ? "rgba(124,58,237,0.45)" : "rgba(255,255,255,0.07)"}`,
                  color: step > s ? "#8b5cf6" : step === s ? "#a78bfa" : "rgba(240,240,248,0.2)",
                  transition: "all 0.3s",
                }}>
                  {step > s ? "✓" : s}
                </div>
                <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: step >= s ? "rgba(240,240,248,0.4)" : "rgba(240,240,248,0.15)", letterSpacing: "0.06em" }}>{stepLabels[i]}</span>
              </div>
              {i < 2 && (
                <div style={{ flex: 1, height: 1, background: step > s ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.06)", margin: "0 12px", marginBottom: 22, transition: "background 0.3s" }} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Paste token */}
        {step === 1 && (
          <div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.14em", color: "#8b5cf6", marginBottom: 14 }}>PASSO 01 · TOKEN DO BOT</p>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 10 }}>Cole o token do seu bot</h1>
            <p style={{ fontSize: 14, color: "rgba(240,240,248,0.38)", marginBottom: 36, lineHeight: 1.75 }}>
              Vá em{" "}
              <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" style={{ color: "#a78bfa", textDecoration: "none" }}>
                discord.com/developers
              </a>
              , abra sua aplicação → Bot e clique em <strong style={{ color: "rgba(240,240,248,0.6)", fontWeight: 600 }}>Reset Token</strong> para copiar.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, color: "rgba(240,240,248,0.3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", marginBottom: 10 }}>BOT TOKEN</label>
              <input
                type="password"
                value={token}
                onChange={e => { setToken(e.target.value); setError(""); }}
                placeholder="MTQ1MjM1MDYx..."
                onKeyDown={e => e.key === "Enter" && validate()}
                style={{
                  width: "100%", padding: "14px 16px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10, color: "#f0f0f8", fontSize: 14,
                  fontFamily: "'JetBrains Mono', monospace",
                  outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.45)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>

            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)", borderRadius: 8, marginBottom: 16 }}>
                <p style={{ fontSize: 12.5, color: "#f43f5e", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{error}</p>
              </div>
            )}

            <button
              onClick={validate}
              disabled={!token.trim() || loading}
              style={{
                width: "100%", padding: "14px",
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                border: "1px solid rgba(124,58,237,0.4)", borderRadius: 10,
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: !token.trim() || loading ? "not-allowed" : "pointer",
                opacity: !token.trim() || loading ? 0.55 : 1,
                fontFamily: "'Syne', sans-serif", transition: "all 0.2s",
                boxShadow: "0 4px 24px rgba(124,58,237,0.3)",
              }}
            >
              {loading ? "Validando..." : "Validar token →"}
            </button>

            <div style={{ marginTop: 20, padding: "13px 16px", background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.1)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#06b6d4", fontSize: 14, flexShrink: 0 }}>◎</span>
              <p style={{ fontSize: 12, color: "rgba(240,240,248,0.3)", margin: 0, lineHeight: 1.6 }}>
                Seu token é criptografado antes de ser salvo. Nunca o compartilhamos com terceiros.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Confirm bot */}
        {step === 2 && botInfo && (
          <div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.14em", color: "#8b5cf6", marginBottom: 14 }}>PASSO 02 · CONFIRMAR BOT</p>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 28 }}>Bot identificado</h1>

            <div style={{ padding: 28, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: 14, marginBottom: 28, display: "flex", alignItems: "center", gap: 20 }}>
              <img
                src={botInfo.bot_avatar}
                alt={botInfo.bot_username}
                style={{ width: 68, height: 68, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.3)", flexShrink: 0 }}
                onError={e => { (e.target as HTMLImageElement).src = "https://cdn.discordapp.com/embed/avatars/0.png"; }}
              />
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(240,240,248,0.28)", letterSpacing: "0.1em", marginBottom: 6 }}>BOT DISCORD · VÁLIDO</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>{botInfo.bot_username}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#8b5cf6", marginTop: 5 }}>ID: {botInfo.bot_id}</div>
              </div>
              <div style={{ marginLeft: "auto", color: "#10b981", fontSize: 22, flexShrink: 0 }}>✓</div>
            </div>

            <p style={{ fontSize: 13.5, color: "rgba(240,240,248,0.38)", marginBottom: 24, lineHeight: 1.7 }}>
              Confirme que este é o bot que deseja conectar à sua assinatura Pulsar.
            </p>

            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)", borderRadius: 8, marginBottom: 16 }}>
                <p style={{ fontSize: 12.5, color: "#f43f5e", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{error}</p>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setStep(1); setError(""); setBotInfo(null); }}
                style={{ flex: 1, padding: "13px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, color: "rgba(240,240,248,0.45)", fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLElement).style.color = "rgba(240,240,248,0.7)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(240,240,248,0.45)"; }}
              >
                ← Voltar
              </button>
              <button
                onClick={connect}
                disabled={loading}
                style={{
                  flex: 2, padding: "13px",
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  border: "1px solid rgba(124,58,237,0.4)", borderRadius: 10,
                  color: "#fff", fontSize: 14, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  fontFamily: "'Syne', sans-serif",
                  boxShadow: "0 4px 24px rgba(124,58,237,0.3)", transition: "all 0.2s",
                }}
              >
                {loading ? "Conectando..." : "Conectar bot →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 88, height: 88,
              background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, rgba(124,58,237,0.05) 100%)",
              border: "1px solid rgba(124,58,237,0.3)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 28px", fontSize: 38, color: "#8b5cf6",
              boxShadow: "0 0 40px rgba(124,58,237,0.2)",
            }}>
              ◈
            </div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.14em", color: "#8b5cf6", marginBottom: 14 }}>PASSO 03 · CONCLUÍDO</p>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 14 }}>Bot conectado!</h1>
            <p style={{ fontSize: 14, color: "rgba(240,240,248,0.38)", marginBottom: 40, lineHeight: 1.75, maxWidth: 380, margin: "0 auto 40px" }}>
              Seu bot foi configurado com sucesso. Agora configure sua loja e comece a vender no Discord com seu próprio branding.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36, textAlign: "left" }}>
              {[
                { icon: "◈", label: "Bot salvo com segurança — token criptografado" },
                { icon: "◎", label: "Pronto para criar produtos e receber PIX" },
                { icon: "◐", label: "Analytics em tempo real disponível no dashboard" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 9 }}>
                  <span style={{ color: "#8b5cf6", filter: "drop-shadow(0 0 4px #8b5cf6)" }}>{item.icon}</span>
                  <span style={{ fontSize: 13, color: "rgba(240,240,248,0.5)" }}>{item.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              style={{
                padding: "14px 52px",
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                border: "1px solid rgba(124,58,237,0.4)", borderRadius: 10,
                color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "'Syne', sans-serif",
                boxShadow: "0 4px 28px rgba(124,58,237,0.45)",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 8px 36px rgba(124,58,237,0.6)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.boxShadow = "0 4px 28px rgba(124,58,237,0.45)"; }}
            >
              Ir ao dashboard →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
