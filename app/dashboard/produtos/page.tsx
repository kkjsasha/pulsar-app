"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_brl: number;
  delivery_type: string;
  delivery_content: string | null;
  stock: number | null;
  banner_url: string | null;
  embed_color: string;
  embed_footer: string | null;
  active: boolean;
  sold_count: number;
  created_at: string;
}

interface FormData {
  name: string;
  description: string;
  price_brl: string;
  delivery_type: string;
  delivery_content: string;
  stock: string;
  banner_url: string;
  embed_color: string;
  embed_footer: string;
}

const DEFAULT_FORM: FormData = {
  name: "", description: "", price_brl: "",
  delivery_type: "chave", delivery_content: "",
  stock: "", banner_url: "", embed_color: "#7c3aed", embed_footer: "",
};

const DELIVERY_LABELS: Record<string, string> = {
  chave: "Chave / Código",
  link: "Link",
  arquivo: "Arquivo",
  manual: "Manual",
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

export default function ProdutosPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [planLimit, setPlanLimit] = useState<number | null>(null);
  const [hasActiveSub, setHasActiveSub] = useState(false);

  const [showPanel, setShowPanel] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3001/products", { credentials: "include" }),
      fetch("http://localhost:3001/subscriptions/status", { credentials: "include" }),
    ])
      .then(async ([prodRes, subRes]) => {
        if (prodRes.status === 401) { router.push("/login"); return; }
        const [prodData, subData] = await Promise.all([prodRes.json(), subRes.json()]);
        setProducts(prodData.products ?? []);
        const active = (subData.subscriptions ?? []).find((s: any) => s.status === "active");
        if (active) {
          setHasActiveSub(true);
          setPlanLimit(active.plans?.max_products ?? null);
        }
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, []);

  const setField = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const focusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = "rgba(124,58,237,0.45)");
  const blurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = "rgba(255,255,255,0.08)");

  const openCreate = () => {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setFormError("");
    setShowPanel(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price_brl: p.price_brl.toString(),
      delivery_type: p.delivery_type,
      delivery_content: p.delivery_content ?? "",
      stock: p.stock != null ? p.stock.toString() : "",
      banner_url: p.banner_url ?? "",
      embed_color: p.embed_color ?? "#7c3aed",
      embed_footer: p.embed_footer ?? "",
    });
    setFormError("");
    setShowPanel(true);
  };

  const closePanel = () => {
    setShowPanel(false);
    setTimeout(() => { setEditing(null); setFormError(""); }, 300);
  };

  const saveProduct = async () => {
    if (!form.name.trim()) { setFormError("Nome é obrigatório."); return; }
    const price = parseFloat(form.price_brl.replace(",", "."));
    if (!price || price <= 0) { setFormError("Preço inválido."); return; }

    setSaving(true);
    setFormError("");

    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price_brl: price,
      delivery_type: form.delivery_type,
      delivery_content: form.delivery_content.trim() || null,
      stock: form.stock !== "" ? parseInt(form.stock, 10) : null,
      banner_url: form.banner_url.trim() || null,
      embed_color: form.embed_color,
      embed_footer: form.embed_footer.trim() || null,
    };

    try {
      const url = editing
        ? `http://localhost:3001/products/${editing.id}`
        : "http://localhost:3001/products";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar produto.");
      setProducts(prev =>
        editing
          ? prev.map(p => (p.id === editing.id ? data.product : p))
          : [data.product, ...prev]
      );
      closePanel();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`http://localhost:3001/products/${deleteTarget.id}`, {
        method: "DELETE", credentials: "include",
      });
      if (res.ok) setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const toggleActive = async (p: Product) => {
    setToggling(p.id);
    try {
      const res = await fetch(`http://localhost:3001/products/${p.id}/toggle`, {
        method: "PATCH", credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setProducts(prev => prev.map(pr => (pr.id === p.id ? data.product : pr)));
    } finally {
      setToggling(null);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, #7c3aed, #06b6d4)", borderRadius: 12, margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "rgba(240,240,248,0.25)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>carregando produtos...</p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const count = products.length;
  const limitLabel = planLimit !== null ? `${count}/${planLimit}` : `${count}/∞`;
  const atLimit = planLimit !== null && count >= planLimit;

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em", margin: 0 }}>Produtos</h1>
          <p style={{ fontSize: 13, color: "rgba(240,240,248,0.3)", marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
            <span style={{ color: atLimit ? "#f43f5e" : "#8b5cf6" }}>{limitLabel}</span> produtos no plano
          </p>
        </div>
        <button
          onClick={openCreate}
          disabled={!hasActiveSub || atLimit}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px",
            background: !hasActiveSub || atLimit ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
            border: !hasActiveSub || atLimit ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(124,58,237,0.4)",
            borderRadius: 9, color: !hasActiveSub || atLimit ? "rgba(240,240,248,0.3)" : "#fff",
            fontSize: 13.5, fontWeight: 600, cursor: !hasActiveSub || atLimit ? "not-allowed" : "pointer",
            fontFamily: "'Syne', sans-serif",
            boxShadow: !hasActiveSub || atLimit ? "none" : "0 4px 20px rgba(124,58,237,0.3)",
            transition: "all 0.2s",
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Novo produto
        </button>
      </div>

      {/* No subscription */}
      {!hasActiveSub && (
        <div style={{ padding: 28, background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.12)", borderRadius: 14, marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 14, color: "#8b5cf6" }}>◈</div>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Assinatura necessária</h3>
          <p style={{ fontSize: 13.5, color: "rgba(240,240,248,0.38)", marginBottom: 24 }}>Assine um plano para criar produtos e começar a vender no Discord.</p>
          <a href="/#planos" style={{ padding: "10px 28px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", borderRadius: 8, color: "#fff", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}>Ver planos →</a>
        </div>
      )}

      {/* Empty state */}
      {hasActiveSub && products.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: 52, marginBottom: 20, color: "rgba(124,58,237,0.25)", filter: "drop-shadow(0 0 20px rgba(124,58,237,0.15))" }}>◐</div>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Nenhum produto criado</h3>
          <p style={{ fontSize: 14, color: "rgba(240,240,248,0.35)", marginBottom: 28 }}>Crie seu primeiro produto e comece a vender no Discord.</p>
          <button onClick={openCreate} style={{ padding: "12px 32px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 9, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Syne', sans-serif", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }}>
            + Criar produto
          </button>
        </div>
      )}

      {/* Product grid */}
      {products.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 16 }}>
          {products.map(p => {
            const accent = p.embed_color || "#7c3aed";
            const isToggling = toggling === p.id;
            return (
              <div key={p.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", transition: "border-color 0.2s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"}
              >
                {/* Banner */}
                {p.banner_url
                  ? <img src={p.banner_url} alt={p.name} style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  : (
                    <div style={{ width: "100%", height: 140, background: `linear-gradient(135deg, ${accent}18 0%, ${accent}06 100%)`, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: `1px solid ${accent}18` }}>
                      <span style={{ fontSize: 36, color: accent, opacity: 0.5, filter: `drop-shadow(0 0 12px ${accent})` }}>◐</span>
                    </div>
                  )
                }

                {/* Body */}
                <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: accent, letterSpacing: "-0.03em", filter: `drop-shadow(0 0 6px ${accent}60)` }}>
                    R$ {p.price_brl.toFixed(2).replace(".", ",")}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                    <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", padding: "3px 8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 4, color: "rgba(240,240,248,0.4)" }}>
                      {DELIVERY_LABELS[p.delivery_type] ?? p.delivery_type}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", padding: "3px 8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 4, color: "rgba(240,240,248,0.4)" }}>
                      {p.stock != null ? `${p.stock} unid.` : "∞ unid."}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", padding: "3px 8px", background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.12)", borderRadius: 4, color: "#06b6d4" }}>
                      {p.sold_count} vendas
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {/* Toggle + badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => toggleActive(p)}
                      disabled={isToggling}
                      title={p.active ? "Desativar" : "Ativar"}
                      style={{
                        width: 34, height: 19, borderRadius: 10, border: "none",
                        background: p.active ? "#7c3aed" : "rgba(255,255,255,0.1)",
                        cursor: isToggling ? "wait" : "pointer",
                        position: "relative", flexShrink: 0, transition: "background 0.2s",
                        padding: 0,
                      }}
                    >
                      <div style={{
                        position: "absolute", top: 2,
                        left: p.active ? 17 : 2,
                        width: 15, height: 15, borderRadius: "50%",
                        background: "#fff", transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      }} />
                    </button>
                    <span style={{
                      fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "0.08em",
                      color: p.active ? "#10b981" : "rgba(240,240,248,0.3)",
                    }}>
                      {p.active ? "ATIVO" : "INATIVO"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => openEdit(p)}
                      style={{ padding: "5px 12px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 6, color: "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(124,58,237,0.18)"; el.style.color = "#fff"; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(124,58,237,0.08)"; el.style.color = "#a78bfa"; }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      style={{ padding: "5px 12px", background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.14)", borderRadius: 6, color: "#f43f5e", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(244,63,94,0.16)"; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(244,63,94,0.06)"; }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Backdrop */}
      <div
        onClick={closePanel}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(2px)",
          zIndex: 199,
          opacity: showPanel ? 1 : 0,
          pointerEvents: showPanel ? "auto" : "none",
          transition: "opacity 0.3s",
        }}
      />

      {/* Slide-in panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 520, maxWidth: "95vw",
        background: "#08080f",
        borderLeft: "1px solid rgba(255,255,255,0.07)",
        transform: showPanel ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 200,
        display: "flex", flexDirection: "column",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.4)",
      }}>
        {/* Panel header */}
        <div style={{ padding: "22px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: "#8b5cf6", marginBottom: 4 }}>
              {editing ? "EDITAR PRODUTO" : "NOVO PRODUTO"}
            </p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em" }}>
              {editing ? editing.name : "Criar produto"}
            </h2>
          </div>
          <button onClick={closePanel} style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(240,240,248,0.5)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
            ✕
          </button>
        </div>

        {/* Panel form */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Nome */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 8 }}>NOME *</label>
            <input value={form.name} onChange={setField("name")} placeholder="Ex: Nitro 1 mês" onFocus={focusBorder} onBlur={blurBorder} style={inp()} />
          </div>

          {/* Descrição */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 8 }}>DESCRIÇÃO</label>
            <textarea value={form.description} onChange={setField("description")} placeholder="Descreva o produto..." rows={3} onFocus={focusBorder as any} onBlur={blurBorder as any}
              style={{ ...inp(), resize: "vertical", minHeight: 80, fontFamily: "'Inter', system-ui, sans-serif" } as React.CSSProperties} />
          </div>

          {/* Preço */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 8 }}>PREÇO (R$) *</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(240,240,248,0.3)", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", pointerEvents: "none" }}>R$</span>
              <input value={form.price_brl} onChange={setField("price_brl")} placeholder="29,90" type="text" inputMode="decimal" onFocus={focusBorder} onBlur={blurBorder} style={inp({ paddingLeft: 36 })} />
            </div>
          </div>

          {/* Tipo de entrega */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 8 }}>TIPO DE ENTREGA</label>
            <select value={form.delivery_type} onChange={setField("delivery_type")} onFocus={focusBorder as any} onBlur={blurBorder as any}
              style={{ ...inp(), appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(240,240,248,0.3)'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" } as React.CSSProperties}>
              <option value="chave">Chave / Código</option>
              <option value="link">Link</option>
              <option value="arquivo">Arquivo</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          {/* Conteúdo de entrega */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 8 }}>CONTEÚDO DE ENTREGA</label>
            <textarea value={form.delivery_content} onChange={setField("delivery_content")} placeholder={form.delivery_type === "chave" ? "XXXX-XXXX-XXXX" : form.delivery_type === "link" ? "https://..." : "Instruções de entrega..."} rows={3} onFocus={focusBorder as any} onBlur={blurBorder as any}
              style={{ ...inp({ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }), resize: "vertical", minHeight: 80 } as React.CSSProperties} />
          </div>

          {/* Estoque */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 8 }}>ESTOQUE <span style={{ color: "rgba(240,240,248,0.2)" }}>(vazio = ilimitado)</span></label>
            <input value={form.stock} onChange={setField("stock")} placeholder="∞" type="number" min="0" onFocus={focusBorder} onBlur={blurBorder} style={inp()} />
          </div>

          {/* Banner URL */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 8 }}>URL DO BANNER</label>
            <input value={form.banner_url} onChange={setField("banner_url")} placeholder="https://i.imgur.com/..." onFocus={focusBorder} onBlur={blurBorder} style={inp({ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 })} />
            {form.banner_url && (
              <img src={form.banner_url} alt="preview" style={{ marginTop: 8, width: "100%", height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid rgba(255,255,255,0.07)" }} onError={e => ((e.target as HTMLImageElement).style.display = "none")} />
            )}
          </div>

          {/* Cor do embed */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 8 }}>COR DO EMBED</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="color" value={form.embed_color} onChange={setField("embed_color")}
                style={{ width: 44, height: 36, padding: 3, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, cursor: "pointer", flexShrink: 0 }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(240,240,248,0.45)", letterSpacing: "0.08em" }}>{form.embed_color.toUpperCase()}</span>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: form.embed_color, flexShrink: 0, boxShadow: `0 0 12px ${form.embed_color}60` }} />
            </div>
          </div>

          {/* Footer do embed */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", color: "rgba(240,240,248,0.4)", marginBottom: 8 }}>FOOTER DO EMBED</label>
            <input value={form.embed_footer} onChange={setField("embed_footer")} placeholder="Minha loja · powered by Pulsar" onFocus={focusBorder} onBlur={blurBorder} style={inp()} />
          </div>

          {formError && (
            <div style={{ padding: "10px 14px", background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)", borderRadius: 8 }}>
              <p style={{ fontSize: 12.5, color: "#f43f5e", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{formError}</p>
            </div>
          )}
        </div>

        {/* Panel footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={closePanel} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, color: "rgba(240,240,248,0.45)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>
            Cancelar
          </button>
          <button
            onClick={saveProduct}
            disabled={saving}
            style={{
              flex: 2, padding: "12px",
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              border: "1px solid rgba(124,58,237,0.4)", borderRadius: 9,
              color: "#fff", fontSize: 13.5, fontWeight: 700,
              cursor: saving ? "wait" : "pointer",
              opacity: saving ? 0.7 : 1,
              fontFamily: "'Syne', sans-serif",
              boxShadow: "0 4px 20px rgba(124,58,237,0.3)", transition: "opacity 0.2s",
            }}
          >
            {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar produto"}
          </button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#0a0a15", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "32px 28px", width: 380, maxWidth: "90vw" }}>
            <div style={{ fontSize: 32, marginBottom: 16, color: "#f43f5e" }}>✕</div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Excluir produto</h3>
            <p style={{ fontSize: 13.5, color: "rgba(240,240,248,0.45)", lineHeight: 1.65, marginBottom: 28 }}>
              Tem certeza que deseja excluir <strong style={{ color: "#f0f0f8" }}>{deleteTarget.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: "11px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, color: "rgba(240,240,248,0.5)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                style={{ flex: 1, padding: "11px", background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: 9, color: "#f43f5e", fontSize: 13.5, fontWeight: 700, cursor: deleting ? "wait" : "pointer", opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
