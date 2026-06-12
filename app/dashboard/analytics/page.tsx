"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AnalyticsData {
  revenue_by_day: { date: string; revenue: number; count: number }[];
  top_products: { product_name: string; total_revenue: number; total_sales: number }[];
  member_growth: { date: string; joins: number; leaves: number }[];
  summary: {
    total_revenue_30d: number;
    total_sales_30d: number;
    avg_ticket: number;
    conversion_rate: number;
  };
}

function fmt(n: number) {
  return "R$ " + n.toFixed(2).replace(".", ",");
}

function fmtShort(n: number) {
  if (n >= 1000) return "R$ " + (n / 1000).toFixed(1).replace(".", ",") + "k";
  return "R$ " + n.toFixed(0);
}

function MiniBar({ value, max, color = "#7c3aed" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
    </div>
  );
}

function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.revenue), 1);
  const W = 100, H = 60;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * W;
    const y = H - (d.revenue / max) * H;
    return `${x},${y}`;
  });

  const area = `0,${H} ${points.join(" ")} ${W},${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 80, overflow: "visible" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#grad)" />
      <polyline points={points.join(" ")} fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPlan, setHasPlan] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    fetch(`${API}/analytics?period=${period}`, { credentials: "include" })
      .then(async res => {
        if (res.status === 401) { router.push("/login"); return; }
        if (res.status === 403) { setHasPlan(false); setLoading(false); return; }
        const d = await res.json();
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

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
      <div style={{ fontSize: 48, marginBottom: 20, color: "rgba(124,58,237,0.3)" }}>◉</div>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 10 }}>Analytics Avançado</h2>
      <p style={{ fontSize: 13.5, color: "rgba(240,240,248,0.35)", maxWidth: 360, lineHeight: 1.7, marginBottom: 8 }}>
        Disponível nos planos <strong style={{ color: "#a78bfa" }}>Pro</strong> e <strong style={{ color: "#a78bfa" }}>Elite</strong>.
      </p>
      <p style={{ fontSize: 12.5, color: "rgba(240,240,248,0.25)", maxWidth: 360, lineHeight: 1.7, marginBottom: 32 }}>
        Receita por dia, produtos mais vendidos, crescimento de membros e taxa de conversão.
      </p>
      <a href="/#planos" style={{ padding: "12px 36px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", borderRadius: 9, color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", fontFamily: "'Syne', sans-serif", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }}>
        Fazer upgrade →
      </a>
    </div>
  );

  const s = data?.summary;
  const maxRevenue = Math.max(...(data?.top_products.map(p => p.total_revenue) || [1]), 1);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em" }}>Analytics</h1>
          <p style={{ fontSize: 13, color: "rgba(240,240,248,0.3)", marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
            desempenho do seu servidor.
          </p>
        </div>
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, padding: 4 }}>
          {(["7d", "30d", "90d"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: "7px 16px", borderRadius: 6, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 500, fontFamily: "'JetBrains Mono', monospace",
              background: period === p ? "rgba(124,58,237,0.2)" : "transparent",
              color: period === p ? "#a78bfa" : "rgba(240,240,248,0.35)",
              transition: "all 0.15s",
            }}>{p}</button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "RECEITA", value: fmt(s?.total_revenue_30d ?? 0), color: "#a78bfa" },
          { label: "VENDAS", value: String(s?.total_sales_30d ?? 0), color: "#f0f0f8" },
          { label: "TICKET MÉDIO", value: fmt(s?.avg_ticket ?? 0), color: "#06b6d4" },
          { label: "CONVERSÃO", value: `${(s?.conversion_rate ?? 0).toFixed(1)}%`, color: "#10b981" },
        ].map(c => (
          <div key={c.label} style={{ padding: "18px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12 }}>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.28)", marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Revenue chart */}
        <div style={{ padding: "22px 24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Receita por dia</div>
              <div style={{ fontSize: 11, color: "rgba(240,240,248,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>últimos {period}</div>
            </div>
          </div>
          {data?.revenue_by_day && data.revenue_by_day.length > 0 ? (
            <>
              <RevenueChart data={data.revenue_by_day} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 10, color: "rgba(240,240,248,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {data.revenue_by_day[0]?.date.slice(5)}
                </span>
                <span style={{ fontSize: 10, color: "rgba(240,240,248,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {data.revenue_by_day[data.revenue_by_day.length - 1]?.date.slice(5)}
                </span>
              </div>
            </>
          ) : (
            <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 12, color: "rgba(240,240,248,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>sem dados no período</p>
            </div>
          )}
        </div>

        {/* Top products */}
        <div style={{ padding: "22px 24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Top produtos</div>
          <div style={{ fontSize: 11, color: "rgba(240,240,248,0.3)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 20 }}>por receita</div>
          {data?.top_products && data.top_products.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {data.top_products.slice(0, 5).map((p, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{p.product_name}</span>
                    <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#a78bfa", flexShrink: 0 }}>{fmtShort(p.total_revenue)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <MiniBar value={p.total_revenue} max={maxRevenue} color="#7c3aed" />
                    <span style={{ fontSize: 10, color: "rgba(240,240,248,0.3)", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{p.total_sales}x</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 12, color: "rgba(240,240,248,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>sem vendas no período</p>
            </div>
          )}
        </div>
      </div>

      {/* Member growth */}
      <div style={{ padding: "22px 24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Crescimento de membros</div>
        <div style={{ fontSize: 11, color: "rgba(240,240,248,0.3)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 20 }}>entradas e saídas por dia</div>
        {data?.member_growth && data.member_growth.length > 0 ? (
          <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 60 }}>
            {data.member_growth.slice(-30).map((d, i) => {
              const maxVal = Math.max(...data.member_growth.map(x => Math.max(x.joins, x.leaves)), 1);
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                  <div style={{ width: "100%", height: `${(d.joins / maxVal) * 100}%`, background: "rgba(16,185,129,0.5)", borderRadius: "2px 2px 0 0", minHeight: d.joins > 0 ? 2 : 0 }} />
                  <div style={{ width: "100%", height: `${(d.leaves / maxVal) * 100}%`, background: "rgba(244,63,94,0.4)", borderRadius: "2px 2px 0 0", minHeight: d.leaves > 0 ? 2 : 0 }} />
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontSize: 12, color: "rgba(240,240,248,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>sem dados no período</p>
          </div>
        )}
        <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(16,185,129,0.6)" }} />
            <span style={{ fontSize: 11, color: "rgba(240,240,248,0.35)", fontFamily: "'JetBrains Mono', monospace" }}>Entradas</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(244,63,94,0.5)" }} />
            <span style={{ fontSize: 11, color: "rgba(240,240,248,0.35)", fontFamily: "'JetBrains Mono', monospace" }}>Saídas</span>
          </div>
        </div>
      </div>
    </>
  );
}
