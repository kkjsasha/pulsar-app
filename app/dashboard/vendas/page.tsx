"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Sale {
  id: string;
  product_name: string;
  product_banner: string | null;
  buyer_discord_id: string;
  buyer_username: string | null;
  amount_brl: number;
  status: "paid" | "pending" | "cancelled" | "refunded";
  payment_method: "pix" | "card";
  created_at: string;
}

interface SaleStats {
  total_revenue: number;
  total_sales: number;
  pending_count: number;
  today_revenue: number;
}

const STATUS_STYLES: Record<string, { bg: string; border: string; color: string; label: string }> = {
  paid:      { bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)",  color: "#10b981", label: "Pago" },
  pending:   { bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.2)",  color: "#fbbf24", label: "Pendente" },
  cancelled: { bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)", color: "#6b7280", label: "Cancelado" },
  refunded:  { bg: "rgba(244,63,94,0.08)",   border: "rgba(244,63,94,0.2)",   color: "#f43f5e", label: "Reembolsado" },
};

const METHOD_LABELS: Record<string, string> = { pix: "PIX", card: "Cartão" };

function fmt(n: number) {
  return "R$ " + n.toFixed(2).replace(".", ",");
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
    " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{
      padding: "20px 24px",
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12, backdropFilter: "blur(20px)",
      flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.3)", marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", color }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "rgba(240,240,248,0.25)", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export default function VendasPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<SaleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "cancelled">("all");
  const [search, setSearch] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    Promise.all([
      fetch(`${API}/sales`, { credentials: "include" }),
      fetch(`${API}/sales/stats`, { credentials: "include" }),
    ])
      .then(async ([salesRes, statsRes]) => {
        if (salesRes.status === 401) { router.push("/login"); return; }
        const [salesData, statsData] = await Promise.all([salesRes.json(), statsRes.json()]);
        setSales(salesData.sales || []);
        setStats(statsData);
        setLoading(false);
      })
      .catch(() => { setSales([]); setStats(null); setLoading(false); });
  }, []);

  const filtered = sales.filter(s => {
    if (filter !== "all" && s.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.product_name.toLowerCase().includes(q) ||
        (s.buyer_username || "").toLowerCase().includes(q) ||
        s.buyer_discord_id.includes(q)
      );
    }
    return true;
  });

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, #7c3aed, #06b6d4)", borderRadius: 12, margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "rgba(240,240,248,0.25)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>carregando...</p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em" }}>Vendas</h1>
        <p style={{ fontSize: 13, color: "rgba(240,240,248,0.3)", marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
          histórico de todas as transações do seu servidor.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <StatCard label="RECEITA TOTAL" value={fmt(stats?.total_revenue ?? 0)} color="#a78bfa" />
        <StatCard label="VENDAS HOJE" value={fmt(stats?.today_revenue ?? 0)} color="#10b981" />
        <StatCard label="TOTAL DE VENDAS" value={String(stats?.total_sales ?? 0)} sub="transações" color="#f0f0f8" />
        <StatCard label="PENDENTES" value={String(stats?.pending_count ?? 0)} sub="aguardando pagamento" color="#fbbf24" />
      </div>

      {/* Filters + search */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, padding: 4 }}>
          {(["all", "paid", "pending", "cancelled"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 500, fontFamily: "'Inter', system-ui, sans-serif",
              background: filter === f ? "rgba(124,58,237,0.2)" : "transparent",
              color: filter === f ? "#a78bfa" : "rgba(240,240,248,0.35)",
              transition: "all 0.15s",
            }}>
              {{ all: "Todas", paid: "Pagas", pending: "Pendentes", cancelled: "Canceladas" }[f]}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por produto ou comprador..."
          style={{
            flex: 1, minWidth: 200, padding: "9px 14px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 9, color: "#f0f0f8", fontSize: 13,
            fontFamily: "'Inter', system-ui, sans-serif",
            outline: "none",
          }}
          onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.35)")}
          onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.07)")}
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{
          padding: "64px 32px", textAlign: "center",
          background: "rgba(255,255,255,0.015)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 14,
        }}>
          <div style={{ fontSize: 40, marginBottom: 16, color: "rgba(124,58,237,0.3)", filter: "drop-shadow(0 0 10px rgba(124,58,237,0.2))" }}>◑</div>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
            {search || filter !== "all" ? "Nenhum resultado" : "Nenhuma venda ainda"}
          </p>
          <p style={{ fontSize: 13, color: "rgba(240,240,248,0.3)" }}>
            {search || filter !== "all" ? "Tente ajustar os filtros." : "Quando alguém comprar um produto, vai aparecer aqui."}
          </p>
        </div>
      ) : (
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14, overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
            padding: "12px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.1em", color: "rgba(240,240,248,0.28)",
          }}>
            <span>PRODUTO</span>
            <span>COMPRADOR</span>
            <span>VALOR</span>
            <span>STATUS</span>
            <span>DATA</span>
          </div>

          {/* Rows */}
          {filtered.map((sale, i) => {
            const st = STATUS_STYLES[sale.status] || STATUS_STYLES.cancelled;
            return (
              <div key={sale.id} style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                padding: "14px 20px", alignItems: "center",
                borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                transition: "background 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  {sale.product_banner ? (
                    <img src={sale.product_banner} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>◈</div>
                  )}
                  <span style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {sale.product_name}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: "rgba(240,240,248,0.5)", fontFamily: "'JetBrains Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {sale.buyer_username || sale.buyer_discord_id.slice(0, 8) + "..."}
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: sale.status === "paid" ? "#10b981" : "rgba(240,240,248,0.6)" }}>
                  {fmt(sale.amount_brl)}
                </div>
                <div>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "3px 9px", borderRadius: 5, fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em",
                    background: st.bg, border: `1px solid ${st.border}`, color: st.color,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: st.color, flexShrink: 0 }} />
                    {st.label}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: "rgba(240,240,248,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtDate(sale.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Count */}
      {filtered.length > 0 && (
        <p style={{ marginTop: 12, fontSize: 11, color: "rgba(240,240,248,0.2)", fontFamily: "'JetBrains Mono', monospace", textAlign: "right" }}>
          {filtered.length} {filtered.length === 1 ? "venda" : "vendas"} exibidas
        </p>
      )}
    </>
  );
}
