"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface BotData {
  id: string;
  bot_id: string;
  bot_username: string;
  bot_avatar: string | null;
  online: boolean;
  last_seen: string | null;
  guild_id: string | null;
}

const inp = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  width: "100%", padding: "11px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8, color: "#f0f0f8", fontSize: 13.5,
  fontFamily: "'Inter', system-ui, sans-serif",
  outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
  ...extra,
});

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
    " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function MeuBotPage() {
  const router = useRouter();
  const [bot, setBot] = useState<BotData | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const [newToken, setNewToken] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [tokenSuccess, setTokenSuccess] = useState("");

  const [showConfirm, setShowConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState("");

  const tokenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("http://localhost:3001/bots/me", { credentials: "include" })
      .then(async res => {
        if (res.status === 401) { router.push("/login"); return; }
        const data = await res.json();
        setBot(data.bot ?? null);
        setLoading(false);
      })
      .catch(() => { setBot(null); setLoading(false); });
  }, []);

  const handleUpdateToken = async () => {
    if (!newToken.trim()) { setTokenError("Insira o novo token."); return; }
    setTokenLoading(true);
    setTokenError("");
    setTokenSuccess("");
    try {
      const res = await fetch("http://localhost:3001/bots/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: newToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao atualizar token.");
      setTokenSuccess("Token atualizado com sucesso.");
      setNewToken("");
      // refresh bot data
      const meRes = await fetch("http://localhost:3001/bots/me", { credentials: "include" });
      const meData = await meRes.json();
      setBot(meData.bot ?? null);
    } catch (err: any) {
      setTokenError(err.message);
    } finally {
      setTokenLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setDisconnectError("");
    try {
      const res = await fetch("http://localhost:3001/bots/me", {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao desconectar.");
      }
      setBot(null);
      setShowConfirm(false);
    } catch (err: any) {
      setDisconnectError(err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, #7c3aed, #06b6d4)", borderRadius: 12, margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "rgba(240,240,248,0.25)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>carregando...</p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // Empty state
  if (!bot) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 20, filter: "drop-shadow(0 0 16px rgba(124,58,237,0.3))", color: "rgba(124,58,237,0.4)" }}>◎</div>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 10 }}>
        Nenhum bot conectado
      </h2>
      <p style={{ fontSize: 13.5, color: "rgba(240,240,248,0.35)", maxWidth: 360, lineHeight: 1.7, marginBottom: 32 }}>
        Conecte um bot Discord para começar a vender automaticamente no seu servidor.
      </p>
      <a
        href="/onboarding"
        style={{
          padding: "12px 36px",
          background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
          borderRadius: 9, color: "#fff", fontSize: 14, fontWeight: 600,
          textDecoration: "none", fontFamily: "'Syne', sans-serif",
          boxShadow: "0 4px 20px rgba(124,58,237,0.3)", transition: "box-shadow 0.2s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 28px rgba(124,58,237,0.45)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(124,58,237,0.3)"; }}
      >
        Conectar bot →
      </a>
    </div>
  );

  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${bot.bot_id}&permissions=8&scope=bot+applications.commands`;

  return (
    <>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em" }}>Meu Bot</h1>
        <p style={{ fontSize: 13, color: "rgba(240,240,248,0.3)", marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
          gerencie o bot conectado à sua loja.
        </p>
      </div>

      {/* Bot card */}
      <div style={{
        padding: "28px 32px", marginBottom: 20,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14, backdropFilter: "blur(20px)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Avatar */}
          {bot.bot_avatar
            ? <img src={bot.bot_avatar} alt={bot.bot_username} style={{ width: 80, height: 80, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.3)", flexShrink: 0 }} />
            : <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(124,58,237,0.12)", border: "2px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0 }}>◎</div>
          }
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 4px" }}>
              {bot.bot_username}
            </h2>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(240,240,248,0.35)", marginBottom: 10, letterSpacing: "0.04em" }}>
              {bot.bot_id}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {/* Status badge */}
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em",
                padding: "4px 10px",
                background: bot.online ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
                border: `1px solid ${bot.online ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)"}`,
                borderRadius: 6, color: bot.online ? "#10b981" : "#f43f5e",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: bot.online ? "#10b981" : "#f43f5e", display: "inline-block", flexShrink: 0, boxShadow: bot.online ? "0 0 6px #10b981" : "0 0 6px #f43f5e" }} />
                {bot.online ? "Online" : "Offline"}
              </span>
              {bot.last_seen && (
                <span style={{ fontSize: 11, color: "rgba(240,240,248,0.28)", fontFamily: "'JetBrains Mono', monospace" }}>
                  visto em {fmtDate(bot.last_seen)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Add to server button */}
        <a
          href={inviteUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 20px",
            background: "rgba(88,101,242,0.15)",
            border: "1px solid rgba(88,101,242,0.3)",
            borderRadius: 9, color: "#7b8aff", fontSize: 13.5, fontWeight: 600,
            textDecoration: "none", fontFamily: "'Syne', sans-serif",
            transition: "all 0.2s", whiteSpace: "nowrap", flexShrink: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(88,101,242,0.22)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(88,101,242,0.15)"; }}
        >
          <span style={{ fontSize: 15 }}>⊞</span> Adicionar ao servidor
        </a>
      </div>

      {/* Update token section */}
      <div style={{
        padding: "24px 28px", marginBottom: 20,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14, backdropFilter: "blur(20px)",
      }}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
          Alterar bot
        </h3>
        <p style={{ fontSize: 12.5, color: "rgba(240,240,248,0.3)", marginBottom: 20 }}>
          Insira um novo token para trocar o bot conectado.
        </p>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 8 }}>
              NOVO TOKEN
            </label>
            <input
              ref={tokenInputRef}
              type="password"
              value={newToken}
              onChange={e => setNewToken(e.target.value)}
              placeholder="••••••••••••••••••••••••"
              onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.45)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              style={inp({ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 })}
            />
          </div>
          <button
            onClick={handleUpdateToken}
            disabled={tokenLoading}
            style={{
              padding: "11px 22px",
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              border: "1px solid rgba(124,58,237,0.4)", borderRadius: 8,
              color: "#fff", fontSize: 13.5, fontWeight: 600,
              cursor: tokenLoading ? "wait" : "pointer", opacity: tokenLoading ? 0.7 : 1,
              fontFamily: "'Syne', sans-serif", whiteSpace: "nowrap",
              boxShadow: "0 4px 16px rgba(124,58,237,0.25)", transition: "opacity 0.2s",
            }}
          >
            {tokenLoading ? "Atualizando..." : "Atualizar token"}
          </button>
        </div>

        {tokenError && (
          <div style={{ marginTop: 12, padding: "9px 14px", background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)", borderRadius: 8 }}>
            <p style={{ fontSize: 12.5, color: "#f43f5e", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{tokenError}</p>
          </div>
        )}
        {tokenSuccess && (
          <div style={{ marginTop: 12, padding: "9px 14px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 8 }}>
            <p style={{ fontSize: 12.5, color: "#10b981", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{tokenSuccess}</p>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div style={{
        padding: "24px 28px",
        background: "rgba(244,63,94,0.03)",
        border: "1px solid rgba(244,63,94,0.12)",
        borderRadius: 14,
      }}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 6px", color: "#f43f5e" }}>
          Zona de perigo
        </h3>
        <p style={{ fontSize: 12.5, color: "rgba(240,240,248,0.3)", marginBottom: 20 }}>
          Desconectar o bot remove o token do sistema e encerra todas as sessões ativas.
        </p>
        <button
          onClick={() => setShowConfirm(true)}
          style={{
            padding: "10px 22px",
            background: "rgba(244,63,94,0.1)",
            border: "1px solid rgba(244,63,94,0.25)",
            borderRadius: 8, color: "#f43f5e", fontSize: 13.5, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Syne', sans-serif", transition: "all 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(244,63,94,0.16)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(244,63,94,0.1)"; }}
        >
          Desconectar bot
        </button>
        {disconnectError && (
          <p style={{ fontSize: 12.5, color: "#f43f5e", marginTop: 10, fontFamily: "'JetBrains Mono', monospace" }}>{disconnectError}</p>
        )}
      </div>

      {/* Confirmation dialog backdrop */}
      {showConfirm && (
        <>
          <div
            onClick={() => !disconnecting && setShowConfirm(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)", zIndex: 199 }}
          />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400, maxWidth: "90vw",
            background: "#0c0c14", border: "1px solid rgba(244,63,94,0.2)",
            borderRadius: 14, padding: "28px 28px 24px",
            zIndex: 200, boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}>
            <div style={{ fontSize: 32, marginBottom: 14, textAlign: "center", filter: "drop-shadow(0 0 8px rgba(244,63,94,0.4))" }}>⚠</div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", textAlign: "center", marginBottom: 10 }}>
              Desconectar bot?
            </h3>
            <p style={{ fontSize: 13, color: "rgba(240,240,248,0.4)", textAlign: "center", lineHeight: 1.7, marginBottom: 24 }}>
              O token será removido e o bot será desligado imediatamente. Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => !disconnecting && setShowConfirm(false)}
                disabled={disconnecting}
                style={{
                  flex: 1, padding: "12px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 9, color: "rgba(240,240,248,0.5)",
                  fontSize: 13.5, fontWeight: 500, cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                style={{
                  flex: 1, padding: "12px",
                  background: "rgba(244,63,94,0.15)",
                  border: "1px solid rgba(244,63,94,0.3)",
                  borderRadius: 9, color: "#f43f5e",
                  fontSize: 13.5, fontWeight: 700,
                  cursor: disconnecting ? "wait" : "pointer",
                  opacity: disconnecting ? 0.7 : 1,
                  fontFamily: "'Syne', sans-serif", transition: "opacity 0.2s",
                }}
              >
                {disconnecting ? "Desconectando..." : "Sim, desconectar"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
