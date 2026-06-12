"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Wallet {
  balance_brl: number;
  total_received_brl: number;
  total_withdrawn_brl: number;
}

interface Transaction {
  id: string;
  type: "sale" | "withdrawal" | "refund";
  amount_brl: number;
  description: string;
  status: string;
  pix_key?: string;
  created_at: string;
}

interface WithdrawForm {
  amount: string;
  pix_key: string;
  pix_key_type: string;
}

const PIX_TYPES = ["CPF", "CNPJ", "Email", "Telefone", "Aleatória"];

const inp = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  width: "100%", padding: "11px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8, color: "#f0f0f8", fontSize: 13.5,
  fontFamily: "'Inter', system-ui, sans-serif",
  outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
  ...extra,
});

const focusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
  (e.target.style.borderColor = "rgba(124,58,237,0.45)");
const blurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
  (e.target.style.borderColor = "rgba(255,255,255,0.08)");

function fmt(n: number) {
  return n.toFixed(2).replace(".", ",");
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
    " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const TYPE_LABELS: Record<string, string> = {
  sale: "Venda",
  withdrawal: "Saque",
  refund: "Reembolso",
};

const TYPE_COLORS: Record<string, { bg: string; border: string; color: string }> = {
  sale:       { bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.2)",  color: "#10b981" },
  withdrawal: { bg: "rgba(244,63,94,0.1)",   border: "rgba(244,63,94,0.2)",   color: "#f43f5e" },
  refund:     { bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.2)",  color: "#fbbf24" },
};

export default function WalletPage() {
  const router = useRouter();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPanel, setShowPanel] = useState(false);
  const [form, setForm] = useState<WithdrawForm>({ amount: "", pix_key: "", pix_key_type: "CPF" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/wallet", { credentials: "include" })
      .then(async res => {
        if (res.status === 401) { router.push("/login"); return; }
        const data = await res.json();
        setWallet(data.wallet ?? null);
        setTransactions(data.transactions ?? []);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, []);

  const setField = (k: keyof WithdrawForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const closePanel = () => {
    setShowPanel(false);
    setTimeout(() => { setForm({ amount: "", pix_key: "", pix_key_type: "CPF" }); setFormError(""); setFormSuccess(""); }, 300);
  };

  const submitWithdraw = async () => {
    const amount = parseFloat(form.amount.replace(",", "."));
    if (!form.amount || isNaN(amount) || amount < 5) {
      setFormError("Valor mínimo de saque é R$5,00.");
      return;
    }
    if (wallet && amount > wallet.balance_brl) {
      setFormError("Saldo insuficiente.");
      return;
    }
    if (!form.pix_key.trim()) {
      setFormError("Informe a chave PIX.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("http://localhost:3001/wallet/withdraw", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, pix_key: form.pix_key.trim(), pix_key_type: form.pix_key_type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao solicitar saque.");

      setFormSuccess(data.message ?? "Saque solicitado com sucesso.");
      setWallet(prev => prev ? { ...prev, balance_brl: prev.balance_brl - amount } : prev);
      setTransactions(prev => [{
        id: Date.now().toString(),
        type: "withdrawal",
        amount_brl: -amount,
        description: `Saque PIX para ${form.pix_key.trim()}`,
        status: "pending",
        pix_key: form.pix_key.trim(),
        created_at: new Date().toISOString(),
      }, ...prev]);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pending = transactions.filter(t => t.type === "withdrawal" && t.status === "pending");

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, #7c3aed, #10b981)", borderRadius: 12, margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "rgba(240,240,248,0.25)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>carregando wallet...</p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em", margin: 0 }}>Wallet</h1>
        <button
          onClick={() => setShowPanel(true)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px",
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            border: "1px solid rgba(124,58,237,0.4)",
            borderRadius: 9, color: "#fff", fontSize: 13.5, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Syne', sans-serif",
            boxShadow: "0 4px 20px rgba(124,58,237,0.3)", transition: "all 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 28px rgba(124,58,237,0.45)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(124,58,237,0.3)"; }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>↑</span> Solicitar saque
        </button>
      </div>

      {/* Balance cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        {/* Saldo disponível */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "24px 26px" }}>
          <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", color: "rgba(240,240,248,0.35)", margin: "0 0 12px" }}>SALDO DISPONÍVEL</p>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 32, fontWeight: 700, color: "#10b981", margin: 0, filter: "drop-shadow(0 0 8px rgba(16,185,129,0.35))", letterSpacing: "-0.02em" }}>
            R$ {fmt(wallet?.balance_brl ?? 0)}
          </p>
        </div>

        {/* Total recebido */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "24px 26px" }}>
          <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", color: "rgba(240,240,248,0.35)", margin: "0 0 12px" }}>TOTAL RECEBIDO</p>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 32, fontWeight: 700, color: "#7c3aed", margin: 0, filter: "drop-shadow(0 0 8px rgba(124,58,237,0.35))", letterSpacing: "-0.02em" }}>
            R$ {fmt(wallet?.total_received_brl ?? 0)}
          </p>
        </div>
      </div>

      {/* Pending withdrawals */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", color: "rgba(240,240,248,0.35)", marginBottom: 12 }}>SAQUES PENDENTES</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pending.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.12)", borderRadius: 10, padding: "12px 16px" }}>
                <span style={{ fontSize: 13.5, color: "rgba(240,240,248,0.65)", fontFamily: "'Inter', system-ui, sans-serif" }}>
                  Saque pendente — <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#f0f0f8" }}>R$ {fmt(Math.abs(t.amount_brl))}</span>
                  {t.pix_key && <span style={{ color: "rgba(240,240,248,0.4)" }}> — chave: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "rgba(240,240,248,0.6)" }}>{t.pix_key}</span></span>}
                </span>
                <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", padding: "3px 9px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 5, color: "#fbbf24", flexShrink: 0, marginLeft: 12 }}>
                  PROCESSANDO
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div>
        <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", color: "rgba(240,240,248,0.35)", marginBottom: 16 }}>HISTÓRICO</p>

        {transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 16, color: "rgba(124,58,237,0.25)" }}>⬡</div>
            <p style={{ fontSize: 14, color: "rgba(240,240,248,0.3)", fontFamily: "'Inter', system-ui, sans-serif" }}>Nenhuma movimentação ainda.</p>
          </div>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "160px 110px 1fr 130px", gap: 0, padding: "11px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
              {["DATA", "TIPO", "DESCRIÇÃO", "VALOR"].map((h, i) => (
                <span key={h} style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", color: "rgba(240,240,248,0.28)", textAlign: i === 3 ? "right" : "left" }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            {transactions.map((t, idx) => {
              const typeStyle = TYPE_COLORS[t.type] ?? TYPE_COLORS.refund;
              const isPositive = t.amount_brl >= 0;
              return (
                <div
                  key={t.id}
                  style={{
                    display: "grid", gridTemplateColumns: "160px 110px 1fr 130px",
                    gap: 0, padding: "14px 20px", alignItems: "center",
                    borderBottom: idx < transactions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.015)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "rgba(240,240,248,0.4)", letterSpacing: "0.02em" }}>
                    {fmtDate(t.created_at)}
                  </span>
                  <span>
                    <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", padding: "3px 9px", background: typeStyle.bg, border: `1px solid ${typeStyle.border}`, borderRadius: 5, color: typeStyle.color }}>
                      {TYPE_LABELS[t.type] ?? t.type}
                    </span>
                  </span>
                  <span style={{ fontSize: 13, color: "rgba(240,240,248,0.55)", fontFamily: "'Inter', system-ui, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 12 }}>
                    {t.description}
                  </span>
                  <span style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: isPositive ? "#10b981" : "#f43f5e", textAlign: "right", letterSpacing: "-0.01em" }}>
                    {isPositive ? "+" : ""}R$ {fmt(Math.abs(t.amount_brl))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Backdrop */}
      <div
        onClick={closePanel}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)",
          zIndex: 199, opacity: showPanel ? 1 : 0,
          pointerEvents: showPanel ? "auto" : "none", transition: "opacity 0.3s",
        }}
      />

      {/* Slide-in panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 460, maxWidth: "95vw",
        background: "#08080f", borderLeft: "1px solid rgba(255,255,255,0.07)",
        transform: showPanel ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 200, display: "flex", flexDirection: "column",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.4)",
      }}>
        {/* Panel header */}
        <div style={{ padding: "22px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: "#8b5cf6", marginBottom: 4 }}>SALDO DISPONÍVEL</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Solicitar saque</h2>
          </div>
          <button onClick={closePanel} style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(240,240,248,0.5)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
            ✕
          </button>
        </div>

        {/* Panel body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Current balance indicator */}
          <div style={{ padding: "14px 16px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.14)", borderRadius: 10 }}>
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)" }}>SALDO DISPONÍVEL</span>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "#10b981", margin: "6px 0 0", letterSpacing: "-0.02em" }}>
              R$ {fmt(wallet?.balance_brl ?? 0)}
            </p>
          </div>

          {/* Valor */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 8 }}>VALOR (R$) *</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(240,240,248,0.3)", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", pointerEvents: "none" }}>R$</span>
              <input
                type="number" min="5" step="0.01"
                value={form.amount}
                onChange={setField("amount")}
                placeholder="5,00"
                onFocus={focusBorder} onBlur={blurBorder}
                style={inp({ paddingLeft: 40 })}
              />
            </div>
            <p style={{ fontSize: 11, color: "rgba(240,240,248,0.25)", fontFamily: "'JetBrains Mono', monospace", marginTop: 6 }}>Mínimo: R$ 5,00</p>
          </div>

          {/* Chave PIX */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 8 }}>CHAVE PIX *</label>
            <input
              type="text"
              value={form.pix_key}
              onChange={setField("pix_key")}
              placeholder="sua@chave.pix"
              onFocus={focusBorder} onBlur={blurBorder}
              style={inp({ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 })}
            />
          </div>

          {/* Tipo da chave */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 8 }}>TIPO DA CHAVE *</label>
            <select
              value={form.pix_key_type}
              onChange={setField("pix_key_type")}
              onFocus={focusBorder as any} onBlur={blurBorder as any}
              style={{
                ...inp(),
                appearance: "none", WebkitAppearance: "none",
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(240,240,248,0.3)'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
              } as React.CSSProperties}
            >
              {PIX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Info */}
          <div style={{ padding: "12px 14px", background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.12)", borderRadius: 8 }}>
            <p style={{ fontSize: 12.5, color: "rgba(240,240,248,0.45)", margin: 0, fontFamily: "'Inter', system-ui, sans-serif", lineHeight: 1.6 }}>
              ⏱ Saques são processados em até 24h.
            </p>
          </div>

          {formError && (
            <div style={{ padding: "10px 14px", background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)", borderRadius: 8 }}>
              <p style={{ fontSize: 12.5, color: "#f43f5e", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{formError}</p>
            </div>
          )}

          {formSuccess && (
            <div style={{ padding: "10px 14px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 8 }}>
              <p style={{ fontSize: 12.5, color: "#10b981", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{formSuccess}</p>
            </div>
          )}
        </div>

        {/* Panel footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={closePanel} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, color: "rgba(240,240,248,0.45)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>
            Cancelar
          </button>
          <button
            onClick={submitWithdraw}
            disabled={submitting}
            style={{
              flex: 2, padding: "12px",
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              border: "1px solid rgba(124,58,237,0.4)", borderRadius: 9,
              color: "#fff", fontSize: 13.5, fontWeight: 700,
              cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.7 : 1,
              fontFamily: "'Syne', sans-serif",
              boxShadow: "0 4px 20px rgba(124,58,237,0.3)", transition: "opacity 0.2s",
            }}
          >
            {submitting ? "Solicitando..." : "Solicitar saque"}
          </button>
        </div>
      </div>
    </>
  );
}
