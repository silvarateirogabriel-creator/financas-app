import { useState, useMemo, useEffect } from "react";

const CATEGORIES = {
  receita: [
    { id: "salario", label: "Salário", color: "#22c55e", icon: "💼" },
    { id: "freelance", label: "Freelance", color: "#10b981", icon: "💻" },
    { id: "investimento", label: "Investimento", color: "#34d399", icon: "📈" },
    { id: "outros_r", label: "Outros", color: "#6ee7b7", icon: "➕" },
  ],
  despesa: [
    { id: "moradia", label: "Moradia", color: "#f43f5e", icon: "🏠" },
    { id: "alimentacao", label: "Alimentação", color: "#fb923c", icon: "🍽️" },
    { id: "transporte", label: "Transporte", color: "#fbbf24", icon: "🚗" },
    { id: "saude", label: "Saúde", color: "#a78bfa", icon: "❤️" },
    { id: "lazer", label: "Lazer", color: "#60a5fa", icon: "🎉" },
    { id: "educacao", label: "Educação", color: "#38bdf8", icon: "📚" },
    { id: "outros_d", label: "Outros", color: "#94a3b8", icon: "📦" },
  ],
};

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const now = new Date();

function formatBRL(v) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ height: 6, background: "#1e293b", borderRadius: 99, overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
    </div>
  );
}

function DonutChart({ data, total }) {
  const size = 140, r = 52, cx = size / 2, cy = size / 2;
  let cumulative = 0;
  const slices = data.map(d => {
    const pct = total > 0 ? d.value / total : 0;
    const start = cumulative;
    cumulative += pct;
    return { ...d, start, pct };
  }).filter(d => d.pct > 0);

  function polar(pct) {
    const angle = pct * 2 * Math.PI - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => {
        const [x1, y1] = polar(s.start);
        const [x2, y2] = polar(s.start + s.pct);
        return (
          <path key={i}
            d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${s.pct > 0.5 ? 1 : 0} 1 ${x2} ${y2} Z`}
            fill={s.color} opacity={0.9}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={36} fill="#0f172a" />
    </svg>
  );
}

export default function App() {
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem("financas_transactions");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [form, setForm] = useState({
    tipo: "despesa", categoria: "", descricao: "", valor: "",
    data: new Date().toISOString().split("T")[0]
  });
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Salva automaticamente no celular
  useEffect(() => {
    try { localStorage.setItem("financas_transactions", JSON.stringify(transactions)); }
    catch {}
  }, [transactions]);

  const filtered = useMemo(() => transactions.filter(t => {
    const d = new Date(t.data + "T00:00:00");
    return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
  }), [transactions, filterMonth, filterYear]);

  const totalReceitas = filtered.filter(t => t.tipo === "receita").reduce((a, t) => a + t.valor, 0);
  const totalDespesas = filtered.filter(t => t.tipo === "despesa").reduce((a, t) => a + t.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  const despesasPorCat = useMemo(() => {
    const map = {};
    filtered.filter(t => t.tipo === "despesa").forEach(t => {
      map[t.categoria] = (map[t.categoria] || 0) + t.valor;
    });
    return Object.entries(map).map(([id, value]) => {
      const cat = CATEGORIES.despesa.find(c => c.id === id);
      return { id, label: cat?.label || id, color: cat?.color || "#888", icon: cat?.icon || "📦", value };
    }).sort((a, b) => b.value - a.value);
  }, [filtered]);

  function handleAdd() {
    if (!form.categoria || !form.valor || !form.data) return;
    setTransactions(prev => [{ ...form, id: Date.now(), valor: parseFloat(form.valor) }, ...prev]);
    setForm({ tipo: "despesa", categoria: "", descricao: "", valor: "", data: new Date().toISOString().split("T")[0] });
    setShowForm(false);
  }

  const cats = CATEGORIES[form.tipo];

  const S = {
    app: { minHeight: "100vh", background: "#0a0f1e", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 },
    header: { background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", padding: "24px 20px 20px", borderBottom: "1px solid #1e293b" },
    monthBtn: { background: "#1e293b", border: "none", color: "#94a3b8", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14 },
    card: (c) => ({ background: "#0f172a", border: `1px solid ${c}22`, borderRadius: 14, padding: "14px 12px" }),
    fab: { position: "fixed", bottom: 84, right: 20, width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", fontSize: 28, cursor: "pointer", boxShadow: "0 4px 24px #6366f166", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
    nav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#0f172a", borderTop: "1px solid #1e293b", display: "flex", zIndex: 99 },
    navBtn: (a) => ({ flex: 1, padding: "12px 0", background: "none", border: "none", color: a ? "#818cf8" : "#475569", cursor: "pointer", fontSize: 11, fontWeight: a ? 700 : 500, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }),
    modal: { position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: "flex-end" },
    modalBox: { background: "#0f172a", width: "100%", borderRadius: "20px 20px 0 0", padding: 24, border: "1px solid #1e293b", borderBottom: "none", boxSizing: "border-box" },
    input: { width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "12px 14px", color: "#e2e8f0", fontSize: 15, marginBottom: 12, outline: "none", boxSizing: "border-box" },
    typeBtn: (a, c) => ({ flex: 1, padding: 10, borderRadius: 10, border: `1.5px solid ${a ? c : "#1e293b"}`, background: a ? `${c}22` : "#1e293b", color: a ? c : "#64748b", fontWeight: 700, cursor: "pointer", fontSize: 14 }),
    addBtn: { width: "100%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", borderRadius: 12, padding: 14, fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 4 },
  };

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={S.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc" }}>💰 Finanças</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Controle financeiro mensal</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>Saldo</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: saldo >= 0 ? "#22c55e" : "#f43f5e" }}>{formatBRL(saldo)}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
          <button style={S.monthBtn} onClick={() => { let m = filterMonth - 1, y = filterYear; if (m < 0) { m = 11; y--; } setFilterMonth(m); setFilterYear(y); }}>‹</button>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", minWidth: 110, textAlign: "center" }}>{MONTHS[filterMonth]} {filterYear}</div>
          <button style={S.monthBtn} onClick={() => { let m = filterMonth + 1, y = filterYear; if (m > 11) { m = 0; y++; } setFilterMonth(m); setFilterYear(y); }}>›</button>
        </div>
      </div>

      {/* Dashboard */}
      {activeTab === "dashboard" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "16px 16px 0" }}>
            {[["Receitas", totalReceitas, "#22c55e"], ["Despesas", totalDespesas, "#f43f5e"], ["Saldo", saldo, saldo >= 0 ? "#818cf8" : "#fb923c"]].map(([l, v, c]) => (
              <div key={l} style={S.card(c)}>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: c, letterSpacing: -0.5 }}>{formatBRL(v)}</div>
              </div>
            ))}
          </div>

          {despesasPorCat.length > 0 ? (
            <div style={{ padding: "16px 16px 0" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Despesas por categoria</div>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
                <DonutChart data={despesasPorCat} total={totalDespesas} />
                <div style={{ flex: 1 }}>
                  {despesasPorCat.slice(0, 4).map(c => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                      <div style={{ fontSize: 12, color: "#94a3b8", flex: 1 }}>{c.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{Math.round(c.value / totalDespesas * 100)}%</div>
                    </div>
                  ))}
                </div>
              </div>
              {despesasPorCat.map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 18, width: 32, textAlign: "center" }}>{c.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{c.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: c.color }}>{formatBRL(c.value)}</span>
                    </div>
                    <MiniBar value={c.value} max={totalDespesas} color={c.color} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📊</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Nenhuma despesa este mês</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Toque em ＋ para adicionar</div>
            </div>
          )}
        </>
      )}

      {/* Lançamentos */}
      {activeTab === "lancamentos" && (
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            {MONTHS[filterMonth]}/{filterYear} · {filtered.length} lançamentos
          </div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Nenhum lançamento</div>
            </div>
          ) : filtered.map(t => {
            const cat = [...CATEGORIES.receita, ...CATEGORIES.despesa].find(c => c.id === t.categoria);
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: "1px solid #1e293b" }}>
                <span style={{ fontSize: 22 }}>{cat?.icon || "📦"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{t.descricao || cat?.label}</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>{cat?.label} · {new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: t.tipo === "receita" ? "#22c55e" : "#f43f5e" }}>
                    {t.tipo === "receita" ? "+" : "-"}{formatBRL(t.valor)}
                  </div>
                  <button onClick={() => setTransactions(p => p.filter(x => x.id !== t.id))}
                    style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 13, padding: 0 }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button style={S.fab} onClick={() => setShowForm(true)}>＋</button>

      {/* Nav */}
      <div style={S.nav}>
        {[["dashboard","📊","Dashboard"],["lancamentos","📋","Lançamentos"]].map(([tab, icon, label]) => (
          <button key={tab} style={S.navBtn(activeTab === tab)} onClick={() => setActiveTab(tab)}>
            <span style={{ fontSize: 20 }}>{icon}</span>{label}
          </button>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={S.modalBox}>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 16, color: "#f8fafc" }}>Novo lançamento</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button style={S.typeBtn(form.tipo === "despesa", "#f43f5e")} onClick={() => setForm(f => ({ ...f, tipo: "despesa", categoria: "" }))}>💸 Despesa</button>
              <button style={S.typeBtn(form.tipo === "receita", "#22c55e")} onClick={() => setForm(f => ({ ...f, tipo: "receita", categoria: "" }))}>💰 Receita</button>
            </div>
            <select style={S.input} value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
              <option value="">Selecione a categoria</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
            <input style={S.input} placeholder="Descrição (opcional)" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            <input style={S.input} type="number" inputMode="decimal" placeholder="Valor (R$)" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
            <input style={S.input} type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
            <button style={S.addBtn} onClick={handleAdd}>Adicionar lançamento</button>
          </div>
        </div>
      )}
    </div>
  );
}
