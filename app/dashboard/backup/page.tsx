"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Backup {
  id: string;
  label: string;
  size_kb: number;
  includes_roles: boolean;
  includes_channels: boolean;
  includes_products: boolean;
  created_at: string;
  download_url: string | null;
}

interface BackupConfig {
  auto_enabled: boolean;
  auto_interval_hours: number;
  max_stored: number;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
    " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function fmtSize(kb: number) {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

const inp = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  padding: "10px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8, color: "#f0f0f8", fontSize: 13.5,
  fontFamily: "'Inter', system-ui, sans-serif",
  outline: "none", transition: "border-color 0.2s",
  ...extra,
});

export default function BackupPage() {
  const router = useRouter();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [config, setConfig] = useState<BackupConfig>({ auto_enabled: false, auto_interval_hours: 24, max_stored: 5 });
  const [loading, setLoading] = useState(true);
  const [hasPlan, setHasPlan] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [configSaving, setConfigSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [label, setLabel] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const load = () =>
    Promise.all([
      fetch(`${API}/backup`, { credentials: "include" }),
      fetch(`${API}/backup/config`, { credentials: "include" }),
    ]).then(async ([bRes, cRes]) => {
      if (bRes.status === 401) { router.push("/login"); return; }
      if (bRes.status === 403) { setHasPlan(false); setLoading(false); return; }
      const [bd, cd] = await Promise.all([bRes.json(), cRes.json()]);
      setBackups(bd.backups || []);
      if (cd.config) setConfig(cd.config);
      setLoading(false);
    }).catch(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const createBackup = async () => {
    setCreating(true); setMsg(null);
    try {
      const res = await fetch(`${API}/backup`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar backup.");
      setBackups(prev => [data.backup, ...prev]);
      setLabel("");
      setMsg({ type: "ok", text: "Backup criado com sucesso!" });
    } catch (err: any) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (id: string) => {
    if (!confirm("Restaurar este backup? Isso vai sobrescrever as configurações atuais do servidor.")) return;
    setRestoring(id); setMsg(null);
    try {
      const res = await fetch(`${API}/backup/${id}/restore`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao restaurar.");
      setMsg({ type: "ok", text: "Servidor restaurado com sucesso!" });
    } catch (err: any) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setRestoring(null);
    }
  };

  const deleteBackup = async (id: string) => {
    if (!confirm("Apagar este backup permanentemente?")) return;
    await fetch(`${API}/backup/${id}`, { method: "DELETE", credentials: "include" });
    setBackups(prev => prev.filter(b => b.id !== id));
  };

  const saveConfig = async () => {
    setConfigSaving(true); setMsg(null);
    try {
      const res = await fetch(`${API}/backup/config`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar.");
      setMsg({ type: "ok", text: "Configurações salvas." });
    } catch (err: any) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setConfigSaving(false);
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

  if (!hasPlan) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 20, color: "rgba(124,58,237,0.3)" }}>⬢</div>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 10 }}>Backup de Servidor</h2>
      <p style={{ fontSize: 13.5, color: "rgba(240,240,248,0.35)", maxWidth: 380, lineHeight: 1.7, marginBottom: 8 }}>
        Disponível exclusivamente no plano <strong style={{ color: "#a78bfa" }}>Elite</strong>.
      </p>
      <p style={{ fontSize: 12.5, color: "rgba(240,240,248,0.25)", maxWidth: 380, lineHeight: 1.7, marginBottom: 32 }}>
        Faça backups automáticos de cargos, canais, produtos e configurações. Restaure em segundos se algo der errado.
      </p>
      <a href="/#planos" style={{ padding: "12px 36px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", borderRadius: 9, color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", fontFamily: "'Syne', sans-serif", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }}>
        Fazer upgrade →
      </a>
    </div>
  );

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em" }}>Backup</h1>
        <p style={{ fontSize: 13, color: "rgba(240,240,248,0.3)", marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
          salve e restaure as configurações do seu servidor.
        </p>
      </div>

      {msg && (
        <div style={{ padding: "12px 16px", marginBottom: 20, borderRadius: 9, background: msg.type === "ok" ? "rgba(16,185,129,0.07)" : "rgba(244,63,94,0.07)", border: `1px solid ${msg.type === "ok" ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)"}` }}>
          <p style={{ fontSize: 13, color: msg.type === "ok" ? "#10b981" : "#f43f5e", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{msg.text}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Create backup */}
        <div style={{ padding: "22px 24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>Criar backup agora</h3>
          <p style={{ fontSize: 12.5, color: "rgba(240,240,248,0.3)", marginBottom: 18 }}>Salva cargos, canais, produtos e configurações.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={label} onChange={e => setLabel(e.target.value)}
              placeholder="Nome do backup (opcional)"
              style={{ ...inp(), flex: 1 }}
              onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.45)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
            <button onClick={createBackup} disabled={creating} style={{
              padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              border: "1px solid rgba(124,58,237,0.4)", borderRadius: 8,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: creating ? "wait" : "pointer",
              opacity: creating ? 0.7 : 1, fontFamily: "'Syne', sans-serif", whiteSpace: "nowrap",
              boxShadow: "0 4px 14px rgba(124,58,237,0.25)", flexShrink: 0,
            }}>
              {creating ? "Criando..." : "Criar"}
            </button>
          </div>
        </div>

        {/* Auto backup config */}
        <div style={{ padding: "22px 24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>Backup automático</h3>
          <p style={{ fontSize: 12.5, color: "rgba(240,240,248,0.3)", marginBottom: 18 }}>Configure backups periódicos automáticos.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "rgba(240,240,248,0.6)" }}>Ativar backup automático</span>
              <div onClick={() => setConfig(c => ({ ...c, auto_enabled: !c.auto_enabled }))} style={{
                width: 38, height: 22, borderRadius: 11, flexShrink: 0,
                background: config.auto_enabled ? "#7c3aed" : "rgba(255,255,255,0.08)",
                position: "relative", cursor: "pointer", transition: "background 0.2s",
                border: `1px solid ${config.auto_enabled ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.1)"}`,
              }}>
                <div style={{ position: "absolute", top: 2, left: config.auto_enabled ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: config.auto_enabled ? "#fff" : "rgba(255,255,255,0.4)", transition: "left 0.2s" }} />
              </div>
            </div>
            {config.auto_enabled && (
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", color: "rgba(240,240,248,0.35)", marginBottom: 6 }}>INTERVALO (horas)</label>
                  <input type="number" min={1} max={168} value={config.auto_interval_hours}
                    onChange={e => setConfig(c => ({ ...c, auto_interval_hours: Number(e.target.value) }))}
                    style={{ ...inp(), width: "100%" }}
                    onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.45)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", color: "rgba(240,240,248,0.35)", marginBottom: 6 }}>MÁX. GUARDADOS</label>
                  <input type="number" min={1} max={20} value={config.max_stored}
                    onChange={e => setConfig(c => ({ ...c, max_stored: Number(e.target.value) }))}
                    style={{ ...inp(), width: "100%" }}
                    onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.45)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>
              </div>
            )}
            <button onClick={saveConfig} disabled={configSaving} style={{
              padding: "9px 18px", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)",
              borderRadius: 8, color: "#a78bfa", fontSize: 13, fontWeight: 600, cursor: configSaving ? "wait" : "pointer",
              opacity: configSaving ? 0.7 : 1, alignSelf: "flex-start",
            }}>
              {configSaving ? "Salvando..." : "Salvar configuração"}
            </button>
          </div>
        </div>
      </div>

      {/* Backups list */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: "rgba(240,240,248,0.6)" }}>
          Backups salvos <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(240,240,248,0.25)", marginLeft: 8 }}>({backups.length})</span>
        </h3>
        {backups.length === 0 ? (
          <div style={{ padding: "40px 32px", textAlign: "center", background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.05)", borderRadius: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Nenhum backup ainda</p>
            <p style={{ fontSize: 13, color: "rgba(240,240,248,0.3)" }}>Crie seu primeiro backup acima.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {backups.map(b => (
              <div key={b.id} style={{
                padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12,
              }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>🗂</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    {b.label || `Backup ${fmtDate(b.created_at)}`}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "rgba(240,240,248,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>{fmtDate(b.created_at)}</span>
                    <span style={{ fontSize: 11, color: "rgba(240,240,248,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>·</span>
                    <span style={{ fontSize: 11, color: "rgba(240,240,248,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>{fmtSize(b.size_kb)}</span>
                    {b.includes_roles    && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 4, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "#a78bfa" }}>cargos</span>}
                    {b.includes_channels && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 4, background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", color: "#06b6d4" }}>canais</span>}
                    {b.includes_products && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 4, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}>produtos</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {b.download_url && (
                    <a href={b.download_url} download style={{
                      padding: "7px 14px", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)",
                      borderRadius: 7, color: "#06b6d4", fontSize: 12, textDecoration: "none", cursor: "pointer",
                    }}>
                      Download
                    </a>
                  )}
                  <button onClick={() => restoreBackup(b.id)} disabled={restoring === b.id} style={{
                    padding: "7px 14px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
                    borderRadius: 7, color: "#a78bfa", fontSize: 12, cursor: restoring === b.id ? "wait" : "pointer",
                    opacity: restoring === b.id ? 0.7 : 1,
                  }}>
                    {restoring === b.id ? "Restaurando..." : "Restaurar"}
                  </button>
                  <button onClick={() => deleteBackup(b.id)} style={{
                    padding: "7px 14px", background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)",
                    borderRadius: 7, color: "#f43f5e", fontSize: 12, cursor: "pointer",
                  }}>
                    Apagar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
