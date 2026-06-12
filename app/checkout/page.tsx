"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "../components/Logo";

function CheckoutContent() {
  const router = useRouter();
  const params = useSearchParams();
  const planId = params.get("plan");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [txId, setTxId] = useState("");
  const [qrBase64, setQrBase64] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [amount, setAmount] = useState(0);
  const [planName, setPlanName] = useState("");
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(1800);
  const [pageStatus, setPageStatus] = useState<"pending" | "paid" | "expired">("pending");

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!planId) { router.push("/#planos"); return; }

    fetch("http://localhost:3001/auth/me", { credentials: "include" })
      .then(res => { if (!res.ok) throw new Error("not_auth"); return res.json(); })
      .then(() =>
        fetch("http://localhost:3001/subscriptions/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ plan_id: planId }),
        })
      )
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setTxId(data.transaction_id);
        setQrBase64(data.qr_code_base64 || "");
        setPixKey(data.qr_code || "");
        setAmount(data.amount || 0);
        setPlanName(data.plan_name || "");
        setSecondsLeft(data.expires_in || 1800);
        setLoading(false);
      })
      .catch(err => {
        if (err.message === "not_auth") { router.push("/login"); return; }
        setError(err.message || "Erro ao gerar pagamento.");
        setLoading(false);
      });
  }, [planId]);

  useEffect(() => {
    if (loading || pageStatus !== "pending") return;
    countdownRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(countdownRef.current!);
          setPageStatus("expired");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [loading, pageStatus]);

  useEffect(() => {
    if (!txId || pageStatus !== "pending") return;
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3001/subscriptions/transaction/${txId}`, { credentials: "include" });
        const data = await res.json();
        if (data.status === "paid") {
          clearInterval(pollingRef.current!);
          setPageStatus("paid");
          setTimeout(() => router.push("/onboarding"), 1500);
        }
      } catch {}
    }, 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [txId, pageStatus]);

  const copyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft < 300;

  if (loading) return (
    <main style={{ minHeight: "100vh", background: "#04040a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, #7c3aed, #06b6d4)", borderRadius: 12, margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "rgba(240,240,248,0.25)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>gerando pagamento pix...</p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </main>
  );

  if (error) return (
    <main style={{ minHeight: "100vh", background: "#04040a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", color: "#f0f0f8" }}>
      <div style={{ textAlign: "center", padding: 40, maxWidth: 400 }}>
        <div style={{ fontSize: 40, marginBottom: 16, color: "#f43f5e" }}>✕</div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Erro ao gerar pagamento</h2>
        <p style={{ color: "rgba(240,240,248,0.4)", fontSize: 14, marginBottom: 28, lineHeight: 1.65 }}>{error}</p>
        <button onClick={() => router.push("/#planos")} style={{ padding: "12px 28px", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 9, color: "#a78bfa", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Voltar aos planos
        </button>
      </div>
    </main>
  );

  if (pageStatus === "paid") return (
    <main style={{ minHeight: "100vh", background: "#04040a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", color: "#f0f0f8" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 72, height: 72, background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 32, color: "#10b981" }}>✓</div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 10 }}>Pagamento confirmado!</h2>
        <p style={{ color: "rgba(240,240,248,0.4)", fontSize: 14 }}>Redirecionando para configuração do bot...</p>
      </div>
    </main>
  );

  if (pageStatus === "expired") return (
    <main style={{ minHeight: "100vh", background: "#04040a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", color: "#f0f0f8" }}>
      <div style={{ textAlign: "center", padding: 40, maxWidth: 400 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⏱</div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>QR Code expirado</h2>
        <p style={{ color: "rgba(240,240,248,0.4)", fontSize: 14, marginBottom: 28 }}>O prazo de 30 minutos encerrou. Gere um novo pagamento para continuar.</p>
        <button onClick={() => router.push(`/checkout?plan=${planId}`)} style={{ padding: "12px 28px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", border: "none", borderRadius: 9, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}>
          Gerar novo pagamento
        </button>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#04040a", color: "#f0f0f8", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <nav style={{ padding: "0 48px", height: 64, display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Logo size={18} />
      </nav>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "64px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>

        {/* Left column */}
        <div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.14em", color: "#8b5cf6", marginBottom: 18 }}>CHECKOUT · PIX</p>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 34, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 6 }}>
            Plano {planName}
          </h1>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 52, fontWeight: 800, color: "#8b5cf6", letterSpacing: "-0.05em", marginBottom: 36, filter: "drop-shadow(0 0 20px rgba(124,58,237,0.3))" }}>
            R$ {Number(amount).toFixed(2).replace(".", ",")}
            <span style={{ fontSize: 14, color: "rgba(240,240,248,0.3)", fontWeight: 400, marginLeft: 8 }}>/mês</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
            {[
              { n: "01", t: "Escaneie o QR Code", d: "Abra o app do seu banco e aponte para o código." },
              { n: "02", t: "Confirme o pagamento", d: `Valor: R$ ${Number(amount).toFixed(2).replace(".", ",")}` },
              { n: "03", t: "Aguarde a confirmação", d: "Detectamos automaticamente, sem precisar recarregar." },
            ].map(s => (
              <div key={s.n} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10 }}>
                <div style={{ width: 30, height: 30, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#8b5cf6", flexShrink: 0 }}>{s.n}</div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{s.t}</div>
                  <div style={{ fontSize: 12, color: "rgba(240,240,248,0.35)" }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "16px 20px", background: isUrgent ? "rgba(244,63,94,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${isUrgent ? "rgba(244,63,94,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 10, display: "flex", alignItems: "center", gap: 14, transition: "all 0.3s" }}>
            <span style={{ fontSize: 22, color: isUrgent ? "#f43f5e" : "rgba(240,240,248,0.3)", transition: "color 0.3s" }}>⏱</span>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: "rgba(240,240,248,0.3)", letterSpacing: "0.1em", marginBottom: 3 }}>EXPIRA EM</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em", color: isUrgent ? "#f43f5e" : "#f0f0f8", transition: "color 0.3s" }}>
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: QR code */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ padding: 20, background: "#fff", borderRadius: 20, boxShadow: "0 0 80px rgba(124,58,237,0.25), 0 0 0 1px rgba(124,58,237,0.1)" }}>
            {qrBase64
              ? <img src={`data:image/png;base64,${qrBase64}`} alt="QR Code PIX" style={{ width: 228, height: 228, display: "block" }} />
              : (
                <div style={{ width: 228, height: 228, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 28, color: "#aaa" }}>◈</span>
                  <span style={{ fontSize: 11, color: "#bbb", fontFamily: "monospace" }}>QR indisponível</span>
                </div>
              )
            }
          </div>

          <p style={{ fontSize: 11.5, color: "rgba(240,240,248,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>ou pague com PIX copia e cola</p>

          <button
            onClick={copyPix}
            disabled={!pixKey}
            style={{ width: "100%", maxWidth: 280, padding: "13px 20px", background: copied ? "rgba(16,185,129,0.1)" : "rgba(124,58,237,0.08)", border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(124,58,237,0.22)"}`, borderRadius: 10, color: copied ? "#10b981" : "#a78bfa", fontSize: 13.5, fontWeight: 600, cursor: pixKey ? "pointer" : "default", transition: "all 0.2s", fontFamily: "'Inter', sans-serif" }}
          >
            {copied ? "✓ Código copiado!" : "◈ Copiar código PIX"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20 }}>
            <span style={{ width: 7, height: 7, background: "#10b981", borderRadius: "50%", boxShadow: "0 0 8px #10b981", animation: "blink 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, color: "rgba(240,240,248,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>aguardando pagamento...</span>
          </div>

          <div style={{ padding: "14px 18px", background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.1)", borderRadius: 10, maxWidth: 280, width: "100%" }}>
            <p style={{ fontSize: 11.5, color: "rgba(240,240,248,0.3)", margin: 0, lineHeight: 1.6, textAlign: "center" }}>
              <span style={{ color: "#06b6d4" }}>◎</span> Após o pagamento confirmado você será redirecionado automaticamente.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: "100vh", background: "#04040a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, #7c3aed, #06b6d4)", borderRadius: 12, animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </main>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
