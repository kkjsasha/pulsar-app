"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Automation {
  id: string;
  name: string;
  trigger: "purchase" | "expiry" | "join" | "ticket_open" | "ticket_close";
  action: "add_role" | "remove_role" | "send_dm" | "send_channel_msg";
  config: {
    role_id?: string;
    role_name?: string;
    channel_id?: string;
    message?: string;
  };
  active: boolean;
  created_at: string;
}

const TRIGGER_LABELS: Record<string, { label: string; desc: string; color: string }> = {
  purchase:      { label: "Compra",         desc: "Quando alguém compra um produto",      color: "#10b981" },
  expiry:        { label: "Expiração",       desc: "Quando uma assinatura expira",         color: "#f43f5e" },
  join:          { label: "Entrada",         desc: "Quando alguém entra no servidor",      color: "#06b6d4" },
  ticket_open:   { label: "Ticket aberto",   desc: "Quando um ticket é aberto",            color: "#fbbf24" },
  ticket_close:  { label: "Ticket fechado",  desc: "Quando um ticket é fechado",           color: "#6b7280" },
};

const ACTION_LABELS: Record<string, string> = {
  add_role:          "Adicionar cargo",
  remove_role:       "Remover cargo",
  send_dm:           "Enviar DM",
  send_channel_msg:  "Mensagem no canal",
};

const inp = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  width: "100%", padding: "11px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8, color: "#f0f0f8", fontSize: 13.5,
  fontFamily: "'Inter', system-ui, sans-serif",
  outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
  ...extra,
});

const sel = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  ...inp(extra),
  cursor: "pointer",
  appearance: "none" as any,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
  paddingRight: 36,
});

const focusB = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
  (e.target.style.borderColor = "rgba(124,58,237,0.45)");
const blurB = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
  (e.target.style.borderColor = "rgba(255,255,255,0.08)");

const EMPTY_FORM = {
  name: "",
  trigger: "purchase" as Automation["trigger"],
  action: "add_role" as Automation["action"],
  role_id: "",
  channel_id: "",
  message: "",
};

export default function AutomacoesPage() {
  const router = useRouter();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPlan, setHasPlan] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const load = () =>
    fetch(`${API}/automations`, { credentials: "include" })
      .then(async res => {
        if (res.status === 401) { router.push("/login"); return; }
        if (res.status === 403) { setHasPlan(false); setLoading(false); return; }
        const d = await res.json();
        setAutomations(d.automations || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const setField = (k: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) { setError("Dê um nome para a automação."); return; }
    setSaving(true); setError("");
    try {
      const body = {
        name: form.name,
        trigger: form.trigger,
        action: form.action,
        config: {
          role_id: form.role_id || undefined,
          channel_id: form.channel_id || undefined,
          message: form.message || undefined,
        },
      };
      const res = await fetch(`${API}/automations`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar.");
      setAutomations(prev => [...prev, data.automation]);
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id: string, active: boolean) => {
    await fetch(`${API}/automations/${id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, active: !active } : a));
  };

  const remove = async (id: string) => {
    if (!confirm("Remover esta automação?")) return;
    await fetch(`${API}/automations/${id}`, { method: "DELETE", credentials: "include" });
    setAutomations(prev => prev.filter(a => a.id !== id));
  };

  const needsRole    = form.action === "add_role" || form.action === "remove_role";
  const needsChannel = form.action === "send_channel_msg";
  const needsMsg     = form.action === "send_dm" || form.action === "send_channel_msg";

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
      <div style={{ fontSize: 48, marginBottom: 20, color: "rgba(124,58,237,0.3)" }}>⬡</div>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 10 }}>Automações</h2>
      <p style={{ fontSize: 13.5, color: "rgba(240,240,248,0.35)", maxWidth: 380, lineHeight: 1.7, marginBottom: 8 }}>
        Disponível nos planos <strong style={{ color: "#a78bfa" }}>Pro</strong> e <strong style={{ color: "#a78bfa" }}>Elite</strong>.
      </p>
      <p style={{ fontSize: 12.5, color: "rgba(240,240,248,0.25)", maxWidth: 380, lineHeight: 1.7, marginBottom: 32 }}>
        Adicione cargos automaticamente após compras, envie DMs de boas-vindas, remova acessos ao expirar e muito mais.
      </p>
      <a href="/#planos" style={{ padding: "12px 36px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", borderRadius: 9, color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", fontFamily: "'Syne', sans-serif", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }}>
        Fazer upgrade →
      </a>
    </div>
  );

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em" }}>Automações</h1>
          <p style={{ fontSize: 13, color: "rgba(240,240,248,0.3)", marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
            ações automáticas baseadas em eventos do servidor.
          </p>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          padding: "10px 22px",
          background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
          border: "1px solid rgba(124,58,237,0.4)", borderRadius: 9,
          color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
          fontFamily: "'Syne', sans-serif", boxShadow: "0 4px 16px rgba(124,58,237,0.25)",
        }}>
          + Nova automação
        </button>
      </div>

      {/* How it works */}
      <div style={{ padding: "16px 20px", background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.12)", borderRadius: 10, marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚡</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Como funciona</p>
          <p style={{ fontSize: 12.5, color: "rgba(240,240,248,0.4)", lineHeight: 1.7 }}>
            Cada automação tem um <strong style={{ color: "rgba(240,240,248,0.6)" }}>gatilho</strong> (evento que dispara) e uma <strong style={{ color: "rgba(240,240,248,0.6)" }}>ação</strong> (o que o bot faz). Ex: quando alguém compra → adicionar cargo VIP.
          </p>
        </div>
      </div>

      {automations.length === 0 ? (
        <div style={{ padding: "64px 32px", textAlign: "center", background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 16, color: "rgba(124,58,237,0.25)" }}>⬡</div>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Nenhuma automação ainda</p>
          <p style={{ fontSize: 13, color: "rgba(240,240,248,0.3)", marginBottom: 24 }}>
            Crie sua primeira automação para o bot agir sozinho.
          </p>
          <button onClick={() => setShowForm(true)} style={{
            padding: "11px 28px", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)",
            borderRadius: 9, color: "#a78bfa", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
          }}>
            + Criar automação
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {automations.map(a => {
            const trig = TRIGGER_LABELS[a.trigger];
            return (
              <div key={a.id} style={{
                padding: "18px 22px",
                background: a.active ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.01)",
                border: `1px solid ${a.active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)"}`,
                borderRadius: 12, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
                opacity: a.active ? 1 : 0.55, transition: "all 0.2s",
              }}>
                {/* Toggle */}
                <div onClick={() => toggle(a.id, a.active)} style={{
                  width: 38, height: 22, borderRadius: 11, flexShrink: 0,
                  background: a.active ? "#7c3aed" : "rgba(255,255,255,0.08)",
                  position: "relative", cursor: "pointer", transition: "background 0.2s",
                  border: `1px solid ${a.active ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.1)"}`,
                }}>
                  <div style={{
                    position: "absolute", top: 2, left: a.active ? 18 : 2,
                    width: 16, height: 16, borderRadius: "50%",
                    background: a.active ? "#fff" : "rgba(255,255,255,0.4)",
                    transition: "left 0.2s",
                  }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{a.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: `${trig?.color}18`, border: `1px solid ${trig?.color}30`, color: trig?.color, fontFamily: "'JetBrains Mono', monospace" }}>
                      {trig?.label}
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(240,240,248,0.25)" }}>→</span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,240,248,0.5)", fontFamily: "'JetBrains Mono', monospace" }}>
                      {ACTION_LABELS[a.action]}
                    </span>
                    {a.config.role_name && (
                      <span style={{ fontSize: 11, color: "rgba(240,240,248,0.3)" }}>#{a.config.role_name}</span>
                    )}
                  </div>
                </div>

                <button onClick={() => remove(a.id)} style={{
                  padding: "6px 14px", background: "rgba(244,63,94,0.07)",
                  border: "1px solid rgba(244,63,94,0.15)",
                  borderRadius: 7, color: "#f43f5e", fontSize: 12, cursor: "pointer", flexShrink: 0,
                }}>
                  Remover
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <>
          <div onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError(""); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 199 }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 460, maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto",
            background: "#0c0c14", border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: 14, padding: "28px",
            zIndex: 200, boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 24 }}>Nova automação</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 7 }}>NOME</label>
                <input value={form.name} onChange={setField("name")} placeholder="ex: Cargo VIP após compra" style={inp()} onFocus={focusB} onBlur={blurB} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 7 }}>GATILHO</label>
                  <select value={form.trigger} onChange={setField("trigger")} style={sel()} onFocus={focusB} onBlur={blurB}>
                    {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 7 }}>AÇÃO</label>
                  <select value={form.action} onChange={setField("action")} style={sel()} onFocus={focusB} onBlur={blurB}>
                    {Object.entries(ACTION_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              {needsRole && (
                <div>
                  <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 7 }}>ID DO CARGO</label>
                  <input value={form.role_id} onChange={setField("role_id")} placeholder="Cole o ID do cargo do Discord" style={inp({ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 })} onFocus={focusB} onBlur={blurB} />
                </div>
              )}
              {needsChannel && (
                <div>
                  <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 7 }}>ID DO CANAL</label>
                  <input value={form.channel_id} onChange={setField("channel_id")} placeholder="Cole o ID do canal do Discord" style={inp({ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 })} onFocus={focusB} onBlur={blurB} />
                </div>
              )}
              {needsMsg && (
                <div>
                  <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 7 }}>MENSAGEM</label>
                  <textarea value={form.message} onChange={setField("message")} rows={3} placeholder="Texto da mensagem... use {username} para mencionar." style={{ ...inp(), resize: "vertical", minHeight: 80 } as any} onFocus={focusB} onBlur={blurB} />
                </div>
              )}
              {/* Trigger description hint */}
              <div style={{ padding: "10px 14px", background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.1)", borderRadius: 8 }}>
                <p style={{ fontSize: 12, color: "rgba(240,240,248,0.4)", margin: 0 }}>
                  💡 {TRIGGER_LABELS[form.trigger]?.desc}
                </p>
              </div>
              {error && <p style={{ fontSize: 12, color: "#f43f5e", fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>{error}</p>}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError(""); }} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "rgba(240,240,248,0.45)", fontSize: 13.5, cursor: "pointer" }}>
                  Cancelar
                </button>
                <button onClick={save} disabled={saving} style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 8, color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1, fontFamily: "'Syne', sans-serif" }}>
                  {saving ? "Salvando..." : "Criar automação"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
