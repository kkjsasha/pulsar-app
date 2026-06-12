"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TicketCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  channel_id: string | null;
}

interface Ticket {
  id: string;
  number: number;
  category_name: string;
  category_emoji: string;
  user_discord_id: string;
  user_username: string | null;
  status: "open" | "closed";
  created_at: string;
  closed_at: string | null;
  thread_id: string | null;
}

interface TicketStats {
  total: number;
  open: number;
  closed_today: number;
}

const STATUS_STYLES = {
  open:   { bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)",  color: "#10b981", label: "Aberto" },
  closed: { bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)", color: "#6b7280", label: "Fechado" },
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
    " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
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

const focusBorder = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "rgba(124,58,237,0.45)");
const blurBorder  = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "rgba(255,255,255,0.08)");

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"tickets" | "config">("tickets");
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [hasPlan, setHasPlan] = useState(true);

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", emoji: "🎫", description: "" });
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    Promise.all([
      fetch(`${API}/tickets`, { credentials: "include" }),
      fetch(`${API}/tickets/categories`, { credentials: "include" }),
    ])
      .then(async ([tickRes, catRes]) => {
        if (tickRes.status === 401) { router.push("/login"); return; }
        if (tickRes.status === 403) { setHasPlan(false); setLoading(false); return; }
        const [tickData, catData] = await Promise.all([tickRes.json(), catRes.json()]);
        setTickets(tickData.tickets || []);
        setStats(tickData.stats || null);
        setCategories(catData.categories || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = tickets.filter(t => filter === "all" || t.status === filter);

  const saveCategory = async () => {
    if (!catForm.name.trim()) { setCatError("Nome é obrigatório."); return; }
    setCatLoading(true); setCatError("");
    try {
      const res = await fetch(`${API}/tickets/categories`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar.");
      setCategories(prev => [...prev, data.category]);
      setShowCatForm(false);
      setCatForm({ name: "", emoji: "🎫", description: "" });
    } catch (err: any) {
      setCatError(err.message);
    } finally {
      setCatLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Remover esta categoria?")) return;
    await fetch(`${API}/tickets/categories/${id}`, { method: "DELETE", credentials: "include" });
    setCategories(prev => prev.filter(c => c.id !== id));
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
      <div style={{ fontSize: 48, marginBottom: 20, color: "rgba(124,58,237,0.35)" }}>◎</div>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 10 }}>
        Módulo de Tickets
      </h2>
      <p style={{ fontSize: 13.5, color: "rgba(240,240,248,0.35)", maxWidth: 360, lineHeight: 1.7, marginBottom: 8 }}>
        Disponível nos planos <strong style={{ color: "#a78bfa" }}>Pro</strong> e <strong style={{ color: "#a78bfa" }}>Elite</strong>.
      </p>
      <p style={{ fontSize: 12.5, color: "rgba(240,240,248,0.25)", maxWidth: 360, lineHeight: 1.7, marginBottom: 32 }}>
        Crie categorias de suporte, gerencie threads privadas e acesse transcrições HTML completas.
      </p>
      <a href="/#planos" style={{
        padding: "12px 36px",
        background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
        borderRadius: 9, color: "#fff", fontSize: 14, fontWeight: 600,
        textDecoration: "none", fontFamily: "'Syne', sans-serif",
        boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
      }}>
        Fazer upgrade →
      </a>
    </div>
  );

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em" }}>Tickets</h1>
        <p style={{ fontSize: 13, color: "rgba(240,240,248,0.3)", marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
          suporte e atendimento do seu servidor.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "TOTAL", value: stats?.total ?? 0, color: "#f0f0f8" },
          { label: "ABERTOS", value: stats?.open ?? 0, color: "#10b981" },
          { label: "FECHADOS HOJE", value: stats?.closed_today ?? 0, color: "rgba(240,240,248,0.4)" },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, minWidth: 120, padding: "18px 22px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.3)", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, padding: 4, width: "fit-content" }}>
        {(["tickets", "config"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 18px", borderRadius: 6, border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 500, fontFamily: "'Inter', system-ui, sans-serif",
            background: tab === t ? "rgba(124,58,237,0.2)" : "transparent",
            color: tab === t ? "#a78bfa" : "rgba(240,240,248,0.35)",
            transition: "all 0.15s",
          }}>
            {t === "tickets" ? "Histórico" : "Categorias"}
          </button>
        ))}
      </div>

      {tab === "tickets" && (
        <>
          {/* Filter */}
          <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, padding: 4, width: "fit-content" }}>
            {(["all", "open", "closed"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "5px 13px", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 500, fontFamily: "'Inter', system-ui, sans-serif",
                background: filter === f ? "rgba(124,58,237,0.18)" : "transparent",
                color: filter === f ? "#a78bfa" : "rgba(240,240,248,0.3)",
                transition: "all 0.15s",
              }}>
                {{ all: "Todos", open: "Abertos", closed: "Fechados" }[f]}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: "48px 32px", textAlign: "center", background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14 }}>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Nenhum ticket</p>
              <p style={{ fontSize: 13, color: "rgba(240,240,248,0.3)" }}>Os tickets abertos no Discord vão aparecer aqui.</p>
            </div>
          ) : (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "60px 2fr 1.5fr 1fr 1.2fr",
                padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.28)",
              }}>
                <span>#</span><span>USUÁRIO</span><span>CATEGORIA</span><span>STATUS</span><span>DATA</span>
              </div>
              {filtered.map((t, i) => {
                const st = STATUS_STYLES[t.status];
                return (
                  <div key={t.id} style={{
                    display: "grid", gridTemplateColumns: "60px 2fr 1.5fr 1fr 1.2fr",
                    padding: "13px 20px", alignItems: "center",
                    borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(240,240,248,0.3)" }}>#{t.number}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 500 }}>{t.user_username || t.user_discord_id.slice(0, 10)}</span>
                    <span style={{ fontSize: 13, color: "rgba(240,240,248,0.6)" }}>{t.category_emoji} {t.category_name}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 5, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", background: st.bg, border: `1px solid ${st.border}`, color: st.color, width: "fit-content" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: st.color, flexShrink: 0 }} />
                      {st.label}
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(240,240,248,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>{fmtDate(t.created_at)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "config" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "rgba(240,240,248,0.35)" }}>Categorias que aparecem quando alguém abre um ticket.</p>
            <button onClick={() => setShowCatForm(true)} style={{
              padding: "9px 20px",
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              border: "1px solid rgba(124,58,237,0.4)", borderRadius: 8,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Syne', sans-serif", boxShadow: "0 4px 14px rgba(124,58,237,0.25)",
            }}>
              + Nova categoria
            </button>
          </div>

          {categories.length === 0 ? (
            <div style={{ padding: "48px 32px", textAlign: "center", background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: 14 }}>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Nenhuma categoria</p>
              <p style={{ fontSize: 13, color: "rgba(240,240,248,0.3)" }}>Crie uma categoria para o bot exibir no Discord.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {categories.map(cat => (
                <div key={cat.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                  padding: "16px 20px",
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{cat.emoji}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{cat.name}</div>
                      {cat.description && (
                        <div style={{ fontSize: 12, color: "rgba(240,240,248,0.35)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {cat.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => deleteCategory(cat.id)} style={{
                    padding: "6px 14px",
                    background: "rgba(244,63,94,0.07)",
                    border: "1px solid rgba(244,63,94,0.15)",
                    borderRadius: 7, color: "#f43f5e", fontSize: 12, cursor: "pointer", flexShrink: 0,
                  }}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Category form modal */}
          {showCatForm && (
            <>
              <div onClick={() => setShowCatForm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)", zIndex: 199 }} />
              <div style={{
                position: "fixed", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: 420, maxWidth: "90vw",
                background: "#0c0c14", border: "1px solid rgba(124,58,237,0.2)",
                borderRadius: 14, padding: "28px",
                zIndex: 200, boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              }}>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 24 }}>
                  Nova categoria
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 7 }}>EMOJI</label>
                    <input value={catForm.emoji} onChange={e => setCatForm(f => ({ ...f, emoji: e.target.value }))} placeholder="🎫" style={inp({ fontSize: 18 })} onFocus={focusBorder} onBlur={blurBorder} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 7 }}>NOME</label>
                    <input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Suporte, Compras, Dúvidas..." style={inp()} onFocus={focusBorder} onBlur={blurBorder} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 7 }}>DESCRIÇÃO (opcional)</label>
                    <input value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} placeholder="Aparece para o usuário ao abrir o ticket" style={inp()} onFocus={focusBorder} onBlur={blurBorder} />
                  </div>
                  {catError && <p style={{ fontSize: 12, color: "#f43f5e", fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>{catError}</p>}
                  <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                    <button onClick={() => setShowCatForm(false)} style={{ flex: 1, padding: "11px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "rgba(240,240,248,0.45)", fontSize: 13.5, cursor: "pointer" }}>Cancelar</button>
                    <button onClick={saveCategory} disabled={catLoading} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 8, color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: catLoading ? "wait" : "pointer", opacity: catLoading ? 0.7 : 1, fontFamily: "'Syne', sans-serif" }}>
                      {catLoading ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
