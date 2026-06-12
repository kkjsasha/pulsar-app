"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Overview {
  mrr: number;
  total_clients: number;
  active_clients: number;
  bots_online: number;
  pending_withdrawals_count: number;
  pending_withdrawals_total: number;
  total_revenue: number;
}

interface Client {
  id: string;
  discord_username: string;
  discord_avatar: string | null;
  plan_name: string | null;
  subscription_status: string | null;
  subscription_expires_at: string | null;
  bot_username: string | null;
  bot_online: boolean;
}

interface Transaction {
  id: string;
  buyer_discord_username: string;
  amount_brl: number;
  status: string;
  created_at: string;
  product_name: string | null;
  seller_username: string | null;
}

interface Withdrawal {
  id: string;
  amount_brl: number;
  pix_key: string;
  pix_key_type: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  discord_username: string | null;
}

interface Bot {
  id: string;
  bot_username: string;
  bot_avatar: string | null;
  online: boolean;
  last_seen: string | null;
  created_at: string;
  discord_username: string | null;
  subscription_status: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toFixed(2).replace(".", ",");
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
    " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

function relativeTime(iso: string | null): string {
  if (!iso) return "nunca";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s atrás`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

const PLAN_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  starter: { color: "#9ca3af", bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.2)" },
  pro:     { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.2)"  },
  elite:   { color: "#06b6d4", bg: "rgba(6,182,212,0.1)",   border: "rgba(6,182,212,0.2)"   },
};

const STATUS_BADGE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  pending:   { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.2)",  label: "pendente"   },
  delivered: { color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.2)",  label: "entregue"   },
  cancelled: { color: "#f43f5e", bg: "rgba(244,63,94,0.1)",   border: "rgba(244,63,94,0.2)",   label: "cancelado"  },
  expired:   { color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)", label: "expirado"   },
  completed: { color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.2)",  label: "pago"       },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #7c3aed, #06b6d4)", borderRadius: 10, margin: "0 auto 14px", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "rgba(240,240,248,0.25)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>carregando...</p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function TableWrap({ children, cols }: { children: React.ReactNode; cols: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, overflow: "hidden" }}>
      {children}
    </div>
  );
}

function Th({ label, right }: { label: string; right?: boolean }) {
  return (
    <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", color: "rgba(240,240,248,0.28)", textAlign: right ? "right" : "left" }}>
      {label}
    </span>
  );
}

function Badge({ status, label, color, bg, border }: { status?: string; label?: string; color: string; bg: string; border: string }) {
  return (
    <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", padding: "3px 9px", background: bg, border: `1px solid ${border}`, borderRadius: 5, color, whiteSpace: "nowrap" }}>
      {label ?? status}
    </span>
  );
}

function OnlineDot({ online }: { online: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: online ? "#10b981" : "#f43f5e", boxShadow: online ? "0 0 6px #10b981" : "0 0 6px #f43f5e", flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: online ? "#10b981" : "#f43f5e", fontFamily: "'JetBrains Mono', monospace" }}>{online ? "online" : "offline"}</span>
    </span>
  );
}

// ── Tab views ─────────────────────────────────────────────────────────────────

function OverviewTab({ data }: { data: Overview }) {
  const cards = [
    { label: "MRR",           value: `R$ ${fmt(data.mrr)}`,        color: "#8b5cf6", sub: "receita mensal recorrente" },
    { label: "CLIENTES ATIVOS", value: String(data.active_clients), color: "#06b6d4", sub: `de ${data.total_clients} total` },
    { label: "BOTS ONLINE",   value: String(data.bots_online),      color: "#10b981", sub: "em tempo real" },
    {
      label: "SAQUES PENDENTES",
      value: String(data.pending_withdrawals_count),
      color: "#fbbf24",
      sub: `R$ ${fmt(data.pending_withdrawals_total)} em aberto`,
    },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 16 }}>
        {cards.map(c => (
          <div key={c.label} style={{ padding: "22px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.12em", color: "rgba(240,240,248,0.25)", marginBottom: 10 }}>{c.label}</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: c.color, letterSpacing: "-0.03em", marginBottom: 4, filter: `drop-shadow(0 0 8px ${c.color}50)` }}>{c.value}</div>
            <div style={{ fontSize: 11, color: "rgba(240,240,248,0.22)" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "28px 26px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.12em", color: "rgba(240,240,248,0.25)", marginBottom: 10 }}>TOTAL RECEITA</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 42, fontWeight: 800, color: "#10b981", letterSpacing: "-0.04em", filter: "drop-shadow(0 0 16px rgba(16,185,129,0.4))" }}>
          R$ {fmt(data.total_revenue)}
        </div>
        <div style={{ fontSize: 12, color: "rgba(240,240,248,0.2)", marginTop: 6 }}>soma de todas as vendas realizadas</div>
      </div>
    </div>
  );
}

function ClientsTab({ clients }: { clients: Client[] }) {
  if (clients.length === 0) return <EmptyState label="Nenhum cliente cadastrado." />;

  const colStyle = "120px 110px 140px 90px 110px";

  return (
    <TableWrap cols={colStyle}>
      <div style={{ display: "grid", gridTemplateColumns: colStyle, gap: 0, padding: "11px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
        <Th label="USUÁRIO" />
        <Th label="PLANO" />
        <Th label="BOT" />
        <Th label="STATUS BOT" />
        <Th label="VENCIMENTO" />
      </div>
      {clients.map((c, idx) => {
        const planStyle = c.plan_name ? (PLAN_COLORS[c.plan_name.toLowerCase()] ?? PLAN_COLORS.starter) : null;
        const expires = c.subscription_expires_at ? fmtDate(c.subscription_expires_at) : "—";
        return (
          <div
            key={c.id}
            style={{ display: "grid", gridTemplateColumns: colStyle, gap: 0, padding: "13px 20px", alignItems: "center", borderBottom: idx < clients.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.12s" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.015)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
              {c.discord_avatar ? (
                <img src={c.discord_avatar} alt="" style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0 }} />
              ) : (
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(124,58,237,0.2)", flexShrink: 0, display: "inline-block" }} />
              )}
              <span style={{ fontSize: 13, color: "#f0f0f8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.discord_username}</span>
            </span>
            <span>
              {planStyle && c.plan_name ? (
                <Badge label={c.plan_name.toLowerCase()} color={planStyle.color} bg={planStyle.bg} border={planStyle.border} />
              ) : (
                <span style={{ fontSize: 12, color: "rgba(240,240,248,0.25)" }}>—</span>
              )}
            </span>
            <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "rgba(240,240,248,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.bot_username ?? "—"}
            </span>
            <span><OnlineDot online={c.bot_online} /></span>
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "rgba(240,240,248,0.4)" }}>{expires}</span>
          </div>
        );
      })}
    </TableWrap>
  );
}

function TransactionsTab({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) return <EmptyState label="Nenhuma transação encontrada." />;

  const colStyle = "130px 1fr 1fr 1fr 100px 90px";

  return (
    <TableWrap cols={colStyle}>
      <div style={{ display: "grid", gridTemplateColumns: colStyle, gap: 0, padding: "11px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
        <Th label="DATA" />
        <Th label="COMPRADOR" />
        <Th label="PRODUTO" />
        <Th label="VENDEDOR" />
        <Th label="VALOR" right />
        <Th label="STATUS" />
      </div>
      {transactions.map((t, idx) => {
        const st = STATUS_BADGE[t.status] ?? STATUS_BADGE.expired;
        return (
          <div
            key={t.id}
            style={{ display: "grid", gridTemplateColumns: colStyle, gap: 0, padding: "13px 20px", alignItems: "center", borderBottom: idx < transactions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.12s" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.015)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "rgba(240,240,248,0.4)" }}>{fmtDate(t.created_at)}</span>
            <span style={{ fontSize: 13, color: "#f0f0f8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{t.buyer_discord_username}</span>
            <span style={{ fontSize: 12, color: "rgba(240,240,248,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{t.product_name ?? "—"}</span>
            <span style={{ fontSize: 12, color: "rgba(240,240,248,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{t.seller_username ?? "—"}</span>
            <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#10b981", textAlign: "right" }}>R$ {fmt(t.amount_brl)}</span>
            <span><Badge label={st.label} color={st.color} bg={st.bg} border={st.border} /></span>
          </div>
        );
      })}
    </TableWrap>
  );
}

function WithdrawalsTab({ withdrawals, onComplete }: { withdrawals: Withdrawal[]; onComplete: (id: string) => void }) {
  const [completing, setCompleting] = useState<string | null>(null);

  if (withdrawals.length === 0) return <EmptyState label="Nenhum saque encontrado." />;

  const colStyle = "130px 120px 100px 1fr 90px 120px";

  const handleComplete = async (id: string) => {
    setCompleting(id);
    try {
      const res = await fetch(`${API}/admin/withdrawals/${id}/complete`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) onComplete(id);
    } finally {
      setCompleting(null);
    }
  };

  return (
    <TableWrap cols={colStyle}>
      <div style={{ display: "grid", gridTemplateColumns: colStyle, gap: 0, padding: "11px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
        <Th label="DATA" />
        <Th label="USUÁRIO" />
        <Th label="VALOR" right />
        <Th label="CHAVE PIX" />
        <Th label="STATUS" />
        <Th label="AÇÃO" />
      </div>
      {withdrawals.map((w, idx) => {
        const st = STATUS_BADGE[w.status] ?? STATUS_BADGE.pending;
        return (
          <div
            key={w.id}
            style={{ display: "grid", gridTemplateColumns: colStyle, gap: 0, padding: "13px 20px", alignItems: "center", borderBottom: idx < withdrawals.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.12s" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.015)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "rgba(240,240,248,0.4)" }}>{fmtDate(w.created_at)}</span>
            <span style={{ fontSize: 13, color: "#f0f0f8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.discord_username ?? "—"}</span>
            <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#fbbf24", textAlign: "right" }}>R$ {fmt(w.amount_brl)}</span>
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "rgba(240,240,248,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
              {w.pix_key} <span style={{ color: "rgba(240,240,248,0.25)" }}>({w.pix_key_type})</span>
            </span>
            <span><Badge label={st.label} color={st.color} bg={st.bg} border={st.border} /></span>
            <span>
              {w.status === "pending" ? (
                <button
                  onClick={() => handleComplete(w.id)}
                  disabled={completing === w.id}
                  style={{ padding: "5px 12px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 7, color: "#10b981", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", cursor: completing === w.id ? "wait" : "pointer", opacity: completing === w.id ? 0.6 : 1, transition: "all 0.15s", whiteSpace: "nowrap" }}
                  onMouseEnter={e => { if (completing !== w.id) (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.18)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.1)"; }}
                >
                  {completing === w.id ? "..." : "Marcar pago"}
                </button>
              ) : (
                <span style={{ fontSize: 11, color: "rgba(240,240,248,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>—</span>
              )}
            </span>
          </div>
        );
      })}
    </TableWrap>
  );
}

function BotsTab({ bots }: { bots: Bot[] }) {
  if (bots.length === 0) return <EmptyState label="Nenhum bot cadastrado." />;

  const colStyle = "1fr 150px 100px 120px";

  return (
    <TableWrap cols={colStyle}>
      <div style={{ display: "grid", gridTemplateColumns: colStyle, gap: 0, padding: "11px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
        <Th label="BOT USERNAME" />
        <Th label="DONO" />
        <Th label="ONLINE" />
        <Th label="ÚLTIMO ACESSO" />
      </div>
      {bots.map((b, idx) => (
        <div
          key={b.id}
          style={{ display: "grid", gridTemplateColumns: colStyle, gap: 0, padding: "13px 20px", alignItems: "center", borderBottom: idx < bots.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.12s" }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.015)")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {b.bot_avatar ? (
              <img src={b.bot_avatar} alt="" style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0 }} />
            ) : (
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(6,182,212,0.15)", flexShrink: 0, display: "inline-block" }} />
            )}
            <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: "#f0f0f8" }}>{b.bot_username}</span>
          </span>
          <span style={{ fontSize: 13, color: "rgba(240,240,248,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.discord_username ?? "—"}</span>
          <span><OnlineDot online={b.online} /></span>
          <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "rgba(240,240,248,0.4)" }}>{relativeTime(b.last_seen)}</span>
        </div>
      ))}
    </TableWrap>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0", background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14 }}>
      <div style={{ fontSize: 36, marginBottom: 14, color: "rgba(124,58,237,0.2)" }}>⬡</div>
      <p style={{ fontSize: 14, color: "rgba(240,240,248,0.3)" }}>{label}</p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

type Tab = "overview" | "clients" | "transactions" | "withdrawals" | "bots";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview",     label: "Visão Geral"  },
  { id: "clients",      label: "Clientes"     },
  { id: "transactions", label: "Transações"   },
  { id: "withdrawals",  label: "Saques"       },
  { id: "bots",         label: "Bots"         },
];

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [authLoading, setAuthLoading] = useState(true);

  const [overview, setOverview]         = useState<Overview | null>(null);
  const [clients, setClients]           = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals]   = useState<Withdrawal[]>([]);
  const [bots, setBots]                 = useState<Bot[]>([]);
  const [tabLoading, setTabLoading]     = useState(false);

  // Auth check on mount
  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then(async res => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!data.is_admin) throw new Error();
        setAuthLoading(false);
      })
      .catch(() => router.push("/dashboard"));
  }, []);

  // Load tab data
  const loadTab = useCallback(async (t: Tab) => {
    setTabLoading(true);
    try {
      if (t === "overview" && !overview) {
        const res = await fetch(`${API}/admin/overview`, { credentials: "include" });
        if (res.ok) setOverview(await res.json());
      } else if (t === "clients" && clients.length === 0) {
        const res = await fetch(`${API}/admin/clients`, { credentials: "include" });
        if (res.ok) setClients(await res.json());
      } else if (t === "transactions" && transactions.length === 0) {
        const res = await fetch(`${API}/admin/transactions`, { credentials: "include" });
        if (res.ok) setTransactions(await res.json());
      } else if (t === "withdrawals" && withdrawals.length === 0) {
        const res = await fetch(`${API}/admin/withdrawals`, { credentials: "include" });
        if (res.ok) setWithdrawals(await res.json());
      } else if (t === "bots" && bots.length === 0) {
        const res = await fetch(`${API}/admin/bots`, { credentials: "include" });
        if (res.ok) setBots(await res.json());
      }
    } finally {
      setTabLoading(false);
    }
  }, [overview, clients, transactions, withdrawals, bots]);

  useEffect(() => {
    if (!authLoading) loadTab(tab);
  }, [authLoading, tab]);

  const switchTab = (t: Tab) => {
    setTab(t);
    loadTab(t);
  };

  const handleCompleteWithdrawal = (id: string) => {
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: "completed", processed_at: new Date().toISOString() } : w));
  };

  const handleLogout = async () => {
    await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
    router.push("/login");
  };

  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "#04040a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, #7c3aed, #06b6d4)", borderRadius: 12, margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "rgba(240,240,248,0.25)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>verificando acesso...</p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#04040a", color: "#f0f0f8", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Top nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(4,4,10,0.9)", backdropFilter: "blur(16px)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #7c3aed, #06b6d4)", borderRadius: 7, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: "-0.03em" }}>Pulsar</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.14em", color: "rgba(240,240,248,0.3)", padding: "2px 7px", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 4 }}>ADMIN</span>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2 }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                style={{
                  padding: "6px 14px",
                  background: tab === t.id ? "rgba(124,58,237,0.12)" : "transparent",
                  border: tab === t.id ? "1px solid rgba(124,58,237,0.25)" : "1px solid transparent",
                  borderRadius: 7,
                  color: tab === t.id ? "#a78bfa" : "rgba(240,240,248,0.4)",
                  fontSize: 13,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: tab === t.id ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (tab !== t.id) (e.currentTarget as HTMLElement).style.color = "rgba(240,240,248,0.7)"; }}
                onMouseLeave={e => { if (tab !== t.id) (e.currentTarget as HTMLElement).style.color = "rgba(240,240,248,0.4)"; }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{ padding: "7px 14px", background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)", borderRadius: 8, color: "#f43f5e", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", transition: "all 0.15s", letterSpacing: "0.04em" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(244,63,94,0.12)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(244,63,94,0.06)"; }}
          >
            logout
          </button>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 32px" }}>
        {/* Tab heading */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: "-0.04em", margin: 0 }}>
            {TABS.find(t => t.id === tab)?.label}
          </h1>
          <p style={{ fontSize: 12, color: "rgba(240,240,248,0.28)", marginTop: 5, fontFamily: "'JetBrains Mono', monospace" }}>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>

        {tabLoading ? (
          <Spinner />
        ) : (
          <>
            {tab === "overview"     && overview     && <OverviewTab data={overview} />}
            {tab === "clients"      && <ClientsTab clients={clients} />}
            {tab === "transactions" && <TransactionsTab transactions={transactions} />}
            {tab === "withdrawals"  && <WithdrawalsTab withdrawals={withdrawals} onComplete={handleCompleteWithdrawal} />}
            {tab === "bots"         && <BotsTab bots={bots} />}
          </>
        )}
      </main>
    </div>
  );
}
