"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  discord_username: string;
  discord_avatar: string;
  wallet: { balance_brl: number };
}

interface Subscription {
  id: string;
  status: string;
  started_at: string;
  expires_at: string;
  plans: { id: string; name: string; price_brl: number };
  bots: { id: string; guild_name: string; guild_id: string; online: boolean; bot_username: string } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3001/auth/me", { credentials: "include" }),
      fetch("http://localhost:3001/subscriptions/status", { credentials: "include" }),
    ])
      .then(async ([meRes, subRes]) => {
        if (!meRes.ok) throw new Error();
        const [meData, subData] = await Promise.all([meRes.json(), subRes.json()]);
        setUser(meData.user);
        setSubscriptions(subData.subscriptions || []);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, #7c3aed, #06b6d4)", borderRadius: 12, margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "rgba(240,240,248,0.25)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>carregando...</p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const sub = subscriptions.find(s => s.status === "active") ?? subscriptions[0] ?? null;
  const hasActiveSub = sub?.status === "active";
  const daysLeft = sub?.expires_at ? Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000) : 0;

  return (
    <>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em" }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "rgba(240,240,248,0.3)", marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>bem-vindo de volta, {user?.discord_username}.</p>
      </div>

      {!hasActiveSub ? (
        <div style={{ padding: 32, background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.12)", borderRadius: 14, marginBottom: 28, textAlign: "center", backdropFilter: "blur(20px)" }}>
          <div style={{ fontSize: 36, marginBottom: 16, filter: "drop-shadow(0 0 12px #8b5cf6)" }}>◈</div>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Nenhum plano ativo</h3>
          <p style={{ fontSize: 14, color: "rgba(240,240,248,0.38)", marginBottom: 28 }}>Assine um plano para conectar seu bot e começar a vender.</p>
          <a href="/#planos" style={{ padding: "12px 36px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", borderRadius: 9, color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 20px rgba(124,58,237,0.3)", fontFamily: "'Syne', sans-serif" }}>Ver planos →</a>
        </div>
      ) : (
        <div style={{ padding: 24, background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)", borderRadius: 14, marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(20px)" }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: "#10b981", marginBottom: 6 }}>PLANO ATIVO</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700 }}>{sub?.plans?.name?.toUpperCase()}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(240,240,248,0.3)", marginBottom: 4 }}>VENCE EM</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, color: daysLeft <= 5 ? "#f43f5e" : "#10b981", letterSpacing: "-0.04em" }}>{daysLeft}d</div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "SALDO WALLET", value: `R$ ${(user?.wallet?.balance_brl || 0).toFixed(2)}`, color: "#8b5cf6", sub: "disponível para saque" },
          { label: "VENDAS HOJE",  value: "0", color: "#06b6d4", sub: "últimas 24h" },
          { label: "TICKETS ABERTOS", value: "0", color: "#f59e0b", sub: "aguardando atendimento" },
          { label: "BOT STATUS", value: hasActiveSub ? "Online" : "Offline", color: hasActiveSub ? "#10b981" : "#f43f5e", sub: hasActiveSub ? "funcionando" : "sem plano" },
        ].map(card => (
          <div key={card.label} style={{ padding: "22px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, backdropFilter: "blur(20px)" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.12em", color: "rgba(240,240,248,0.25)", marginBottom: 10 }}>{card.label}</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: card.color, letterSpacing: "-0.03em", marginBottom: 4, filter: `drop-shadow(0 0 8px ${card.color}50)` }}>{card.value}</div>
            <div style={{ fontSize: 11, color: "rgba(240,240,248,0.22)" }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: 28, background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, backdropFilter: "blur(20px)" }}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 20, letterSpacing: "-0.02em" }}>Próximos passos</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { step: "01", title: "Conectar seu bot", desc: "Vá em 'Meu Bot' e cole o token do seu bot Discord.", href: "/dashboard/bot" },
            { step: "02", title: "Criar seu primeiro produto", desc: "Vá em 'Produtos' e configure sua loja.", href: "/dashboard/produtos" },
            { step: "03", title: "Configurar os embeds", desc: "Customize a aparência do bot no seu servidor.", href: "/dashboard/bot" },
          ].map(s => (
            <a key={s.step} href={s.href} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "rgba(255,255,255,0.018)", borderRadius: 9, border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "border-color 0.15s", textDecoration: "none", color: "inherit" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.2)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.04)"; }}>
              <div style={{ width: 34, height: 34, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#8b5cf6", flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: "rgba(240,240,248,0.3)" }}>{s.desc}</div>
              </div>
              <span style={{ marginLeft: "auto", color: "rgba(240,240,248,0.18)" }}>→</span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
