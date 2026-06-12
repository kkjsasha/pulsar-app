"use client";
import { useEffect, useState } from "react";
import PulsarStar from "./components/PulsarStar";
import Logo from "./components/Logo";

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    const onMouse = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("scroll", onScroll);
    window.addEventListener("mousemove", onMouse);
    fetch("http://localhost:3001/plans").then(r => r.json()).then(d => setPlans(d.plans || [])).catch(() => {});
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("mousemove", onMouse); };
  }, []);

  const modules = [
    { icon: "◈", label: "VENDAS", title: "Loja no Discord", desc: "Produtos com banner, QR Code PIX automático, entrega digital instantânea e wallet própria. Seus dados nunca aparecem.", color: "#8b5cf6" },
    { icon: "◎", label: "TICKETS", title: "Suporte premium", desc: "Categorias customizadas, threads privadas, transcrições HTML e avaliação de atendimento por estrelas.", color: "#06b6d4" },
    { icon: "◐", label: "ANALYTICS", title: "Dados em tempo real", desc: "Gráficos de vendas, membros, tickets e receita. WebSocket nativo — sempre atualizado, sem refresh.", color: "#8b5cf6" },
    { icon: "◬", label: "AUTOMAÇÕES", title: "Piloto automático", desc: "Auto roles, welcome system, autoresponder, moderação automática e comandos criados pelo painel.", color: "#06b6d4" },
    { icon: "◑", label: "BACKUP", title: "Segurança total", desc: "Snapshot de canais, cargos e permissões. Restaure toda a estrutura do servidor com 1 clique.", color: "#8b5cf6" },
    { icon: "◉", label: "OAUTH2", title: "Anti-alt integrado", desc: "Verificação real via Discord OAuth2. Detecte alt accounts e rastreie IPs automaticamente.", color: "#06b6d4" },
  ];

  const planMeta: Record<string, any> = {
    starter: { desc: "Para quem quer vender no Discord agora.", features: ["Módulo de Vendas completo", "Até 10 produtos", "QR Code PIX automático", "Entrega automática", "Wallet + saque PIX", "Cupons de desconto", "Customização de embeds"] },
    pro:     { desc: "Vendas + suporte organizado + dados reais.", highlight: true, features: ["Tudo do Starter", "Até 50 produtos", "Módulo de Tickets", "Transcrições HTML", "Analytics completo", "Gráficos em tempo real", "Suporte prioritário"] },
    elite:   { desc: "O ecossistema completo. Sem limites.", features: ["Tudo do Pro", "Produtos ilimitados", "Automações", "Backup de servidor", "OAuth2 anti-alt", "Comandos customizados", "Suporte VIP"] },
  };

  const prices: Record<string, string> = { starter: "5,70", pro: "14,90", elite: "25,00" };

  return (
    <main style={{ background: "#04040a", color: "#f0f0f8", fontFamily: "'Inter', system-ui, sans-serif", overflowX: "hidden" }}>

      {/* CURSOR GLOW */}
      <div style={{ position: "fixed", left: mouse.x - 320, top: mouse.y - 320, width: 640, height: 640, background: "radial-gradient(circle, rgba(124,58,237,0.045) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0, transition: "left 0.18s, top 0.18s", borderRadius: "50%" }} />

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 56px", height: 64,
        background: scrollY > 30 ? "rgba(4,4,10,0.85)" : "transparent",
        backdropFilter: scrollY > 30 ? "blur(24px)" : "none",
        borderBottom: `1px solid ${scrollY > 30 ? "rgba(255,255,255,0.05)" : "transparent"}`,
        transition: "all 0.35s",
      }}>
        <Logo size={18} />

        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          {[["#módulos", "Módulos"], ["#planos", "Planos"]].map(([href, label]) => (
            <a key={href} href={href} style={{ color: "rgba(240,240,248,0.4)", textDecoration: "none", fontSize: 13.5, fontWeight: 500, transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f0f0f8"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(240,240,248,0.4)"}>
              {label}
            </a>
          ))}
        </div>

        <a href="/login" style={{ padding: "8px 22px", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 8, color: "#a78bfa", fontSize: 13.5, fontWeight: 600, textDecoration: "none", backdropFilter: "blur(10px)", transition: "all 0.2s" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(124,58,237,0.25)"; el.style.color = "#fff"; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(124,58,237,0.12)"; el.style.color = "#a78bfa"; }}>
          Entrar →
        </a>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "100px 24px 80px", position: "relative", overflow: "hidden" }}>

        {/* PULSAR CENTRALIZADA ATRÁS DO TEXTO */}
        <div style={{ position: "absolute", top: "50%", left: "50%", animation: "float 9s ease-in-out infinite", zIndex: 0, pointerEvents: "none" }}>
          <PulsarStar size={720} opacity={0.28} />
        </div>

        {/* Gradientes auxiliares */}
        <div style={{ position: "absolute", top: "25%", left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(124,58,237,0.07) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "15%", left: "50%", transform: "translateX(-50%)", width: 400, height: 200, background: "radial-gradient(ellipse, rgba(6,182,212,0.04) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

        {/* CONTEÚDO — zIndex acima da pulsar */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 100, fontSize: 11, color: "#a78bfa", marginBottom: 44, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.09em", backdropFilter: "blur(10px)", animation: "fadeUp 0.6s ease both" }}>
            <span style={{ width: 5, height: 5, background: "#06b6d4", borderRadius: "50%", boxShadow: "0 0 6px #06b6d4" }} />
            AUTOMAÇÃO DISCORD · BRASIL · 2025
          </div>

          {/* Título */}
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(52px, 9vw, 108px)", fontWeight: 800, lineHeight: 0.92, letterSpacing: "-0.05em", marginBottom: 36, animation: "fadeUp 0.7s 0.1s ease both" }}>
            <span style={{ display: "block", color: "#f0f0f8" }}>O ecossistema</span>
            <span style={{ display: "block", background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 45%, #06b6d4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>que seu servidor</span>
            <span style={{ display: "block", color: "rgba(240,240,248,0.4)" }}>merecia.</span>
          </h1>

          {/* Sub */}
          <p style={{ fontSize: 17, color: "rgba(240,240,248,0.42)", maxWidth: 460, lineHeight: 1.8, marginBottom: 52, fontWeight: 400, animation: "fadeUp 0.7s 0.2s ease both" }}>
            Conecte o <span style={{ color: "#f0f0f8", fontWeight: 500 }}>seu próprio bot</span> e ganhe vendas automáticas, tickets, analytics e backup — com seu branding, sua identidade.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", animation: "fadeUp 0.7s 0.3s ease both" }}>
            <a href="/login" style={{ padding: "15px 44px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none", fontFamily: "'Syne', sans-serif", boxShadow: "0 0 40px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.12)", border: "1px solid rgba(124,58,237,0.4)", transition: "all 0.2s" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 8px 50px rgba(124,58,237,0.65), inset 0 1px 0 rgba(255,255,255,0.12)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.boxShadow = "0 0 40px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.12)"; }}>
              Começar agora →
            </a>
            <a href="#planos" style={{ padding: "15px 32px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, color: "rgba(240,240,248,0.55)", fontSize: 15, fontWeight: 500, textDecoration: "none", backdropFilter: "blur(10px)", transition: "all 0.2s" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(124,58,237,0.3)"; el.style.color = "#f0f0f8"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(255,255,255,0.07)"; el.style.color = "rgba(240,240,248,0.55)"; }}>
              Ver planos
            </a>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", marginTop: 80, paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.05)", animation: "fadeUp 0.7s 0.4s ease both" }}>
            {[
              { n: "R$5", u: ",70", l: "plano mais barato do BR" },
              { n: "1", u: " bot", l: "seu branding, sua marca" },
              { n: "6", u: " módulos", l: "em uma plataforma só" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center", padding: "0 48px", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em" }}>
                  {s.n}<span style={{ color: "#8b5cf6" }}>{s.u}</span>
                </div>
                <div style={{ fontSize: 11.5, color: "rgba(240,240,248,0.3)", marginTop: 5, fontFamily: "'JetBrains Mono', monospace" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MÓDULOS */}
      <section id="módulos" style={{ padding: "120px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.15em", color: "#06b6d4", marginBottom: 16 }}>MÓDULOS</p>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px, 4.5vw, 58px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05 }}>
            Tudo que você precisa.<br /><span style={{ color: "rgba(240,240,248,0.3)" }}>Em um lugar só.</span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "rgba(255,255,255,0.04)", borderRadius: 18, overflow: "hidden" }}>
          {modules.map(mod => (
            <div key={mod.label} style={{ padding: "36px 32px", background: "#05050d", transition: "background 0.25s", cursor: "default" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `rgba(${mod.color === "#8b5cf6" ? "139,92,246" : "6,182,212"},0.05)`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#05050d"; }}>
              <div style={{ fontSize: 22, color: mod.color, marginBottom: 18, filter: `drop-shadow(0 0 8px ${mod.color})` }}>{mod.icon}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: mod.color, marginBottom: 12, opacity: 0.75 }}>{mod.label}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 12 }}>{mod.title}</div>
              <div style={{ fontSize: 13.5, color: "rgba(240,240,248,0.38)", lineHeight: 1.75 }}>{mod.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WALLET */}
      <section style={{ padding: "0 24px 120px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ padding: "52px 60px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, backdropFilter: "blur(24px)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -80, right: -80, width: 280, height: 280, background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
          <div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.15em", color: "#8b5cf6", marginBottom: 20 }}>SISTEMA DE PAGAMENTOS</p>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 20 }}>
              Receba sem expor<br /><span style={{ color: "#8b5cf6" }}>seus dados.</span>
            </h3>
            <p style={{ fontSize: 14.5, color: "rgba(240,240,248,0.4)", lineHeight: 1.8 }}>O comprador só vê o QR Code. Seu saldo cai na wallet e você saca via PIX quando quiser.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {["QR Code gerado automaticamente", "Seus dados nunca aparecem", "Saldo na wallet em segundos", "Saque via PIX instantâneo", "Histórico completo no dashboard"].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 9, fontSize: 13.5, color: "rgba(240,240,248,0.6)", backdropFilter: "blur(10px)" }}>
                <span style={{ color: "#8b5cf6", filter: "drop-shadow(0 0 4px #8b5cf6)" }}>◈</span>{item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" style={{ padding: "0 24px 120px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.15em", color: "#8b5cf6", marginBottom: 16 }}>PLANOS</p>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px, 4.5vw, 58px)", fontWeight: 800, letterSpacing: "-0.04em" }}>
            Preço justo.<br /><span style={{ color: "rgba(240,240,248,0.3)" }}>Sem enrolação.</span>
          </h2>
          <p style={{ fontSize: 13, color: "rgba(240,240,248,0.3)", marginTop: 18, fontFamily: "'JetBrains Mono', monospace" }}>1 assinatura = 1 servidor · sem taxa sobre vendas</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, alignItems: "center" }}>
          {["starter", "pro", "elite"].map(name => {
            const meta = planMeta[name];
            const isPro = name === "pro";
            return (
              <div key={name} style={{ padding: "36px 28px", background: isPro ? "rgba(124,58,237,0.07)" : "rgba(255,255,255,0.02)", border: `1px solid ${isPro ? "rgba(124,58,237,0.22)" : "rgba(255,255,255,0.05)"}`, borderRadius: 16, backdropFilter: "blur(20px)", position: "relative", transform: isPro ? "scale(1.04)" : "scale(1)", transition: "transform 0.2s" }}>
                {isPro && (
                  <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", padding: "4px 18px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", borderRadius: 100, fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(124,58,237,0.4)" }}>
                    MAIS POPULAR
                  </div>
                )}
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.12em", color: isPro ? "#a78bfa" : "rgba(240,240,248,0.35)", marginBottom: 20 }}>{name.toUpperCase()}</div>
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 52, fontWeight: 800, letterSpacing: "-0.05em" }}>R${prices[name]}</span>
                  <span style={{ fontSize: 13, color: "rgba(240,240,248,0.3)", marginLeft: 4 }}>/mês</span>
                </div>
                <p style={{ fontSize: 13, color: "rgba(240,240,248,0.38)", marginBottom: 28, lineHeight: 1.65 }}>{meta.desc}</p>
                <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 24 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
                  {meta.features.map((f: string) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "rgba(240,240,248,0.6)" }}>
                      <span style={{ color: "#8b5cf6", flexShrink: 0, filter: "drop-shadow(0 0 3px #8b5cf6)" }}>◈</span>{f}
                    </div>
                  ))}
                </div>
                {(() => {
                  const planObj = plans.find(p => p.name?.toLowerCase() === name || p.slug?.toLowerCase() === name);
                  const href = planObj ? `/checkout?plan=${planObj.id}` : "/login";
                  return (
                    <a href={href} style={{ display: "block", width: "100%", padding: "13px", background: isPro ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "rgba(255,255,255,0.03)", border: `1px solid ${isPro ? "transparent" : "rgba(255,255,255,0.06)"}`, borderRadius: 9, color: isPro ? "#fff" : "rgba(240,240,248,0.55)", fontSize: 14, fontWeight: 600, textAlign: "center", textDecoration: "none", boxShadow: isPro ? "0 4px 24px rgba(124,58,237,0.35)" : "none", transition: "all 0.2s", fontFamily: "'Inter', sans-serif" }}>
                      Assinar {name.charAt(0).toUpperCase() + name.slice(1)}
                    </a>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: "80px 24px 140px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", animation: "float 10s ease-in-out infinite", zIndex: 0, pointerEvents: "none" }}>
          <PulsarStar size={520} opacity={0.1} />
        </div>
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(36px, 6vw, 76px)", fontWeight: 800, letterSpacing: "-0.05em", marginBottom: 20 }}>Pronto para começar?</h2>
          <p style={{ fontSize: 17, color: "rgba(240,240,248,0.38)", marginBottom: 52 }}>Logue com Discord e configure seu bot em minutos.</p>
          <a href="/login" style={{ display: "inline-block", padding: "16px 60px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", borderRadius: 10, color: "#fff", fontSize: 16, fontWeight: 700, textDecoration: "none", fontFamily: "'Syne', sans-serif", boxShadow: "0 0 60px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.1)", border: "1px solid rgba(124,58,237,0.35)" }}>
            Entrar com Discord →
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "28px 56px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <Logo size={17} />
        <p style={{ fontSize: 12, color: "rgba(240,240,248,0.18)", fontFamily: "'JetBrains Mono', monospace" }}>© 2025 Pulsar App · Todos os direitos reservados</p>
      </footer>
    </main>
  );
}
