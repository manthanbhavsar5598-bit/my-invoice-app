import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, BarChart3, Wallet, AlertTriangle, CheckCircle2, Clock3, TrendingUp, FileText, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import Metric from "./Metric";
import Stamp from "./Stamp";
import { todayISO, displayStatus, computeTotals, money, fmtDate } from "../utils/helpers";

export default function Dashboard({ data, clientsById }) {
  const navigate = useNavigate();
  const symbol = data.business.currencySymbol;
  const outstanding = data.invoices.filter((i) => displayStatus(i) === "sent" || displayStatus(i) === "overdue");
  const outstandingTotal = outstanding.reduce((s, i) => s + computeTotals(i).total, 0);
  const overdueCount = data.invoices.filter((i) => displayStatus(i) === "overdue").length;
  const thisMonth = todayISO().slice(0, 7);
  const paidThisMonth = data.invoices
    .filter((i) => i.status === "paid" && (i.paidDate || "").slice(0, 7) === thisMonth)
    .reduce((s, i) => s + computeTotals(i).total, 0);
  const dueRecurring = data.recurring.filter((r) => r.active && r.nextDate <= todayISO()).length;

  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString(undefined, { month: "short" }) });
    }
    return months.map((m) => {
      const total = data.invoices
        .filter((i) => i.status === "paid" && (i.paidDate || i.issueDate || "").slice(0, 7) === m.key)
        .reduce((s, i) => s + computeTotals(i).total, 0);
      return { name: m.label, revenue: Math.round(total * 100) / 100 };
    });
  }, [data.invoices]);

  const recent = [...data.invoices].sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || "")).slice(0, 6);
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div style={{ background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div>
          <h1 className="lg-display" style={{ fontSize: 28, margin: 0 }}>Dashboard</h1>
          <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 2 }}>{data.business.name} · {today}</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="lg-btn-ghost" onClick={() => navigate("/reports")}><BarChart3 size={14} /> Reports</button>
          <button className="lg-btn" onClick={() => navigate("/invoices/new")}><Plus size={15} /> New invoice</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 22, marginBottom: 22 }}>
        <Metric icon={Wallet} label="Outstanding" value={money(outstandingTotal, symbol)} accent="var(--gold)" tint="#FBF1DE" />
        <Metric icon={AlertTriangle} label="Overdue invoices" value={String(overdueCount)} accent="var(--stamp-red)" tint="#FBE9E6" />
        <Metric icon={CheckCircle2} label="Paid this month" value={money(paidThisMonth, symbol)} accent="var(--ledger-green)" tint="#E8F1EB" />
        <Metric icon={Clock3} label="Recurring due" value={String(dueRecurring)} accent="var(--ink)" tint="#F0EFEC" />
      </div>

      <div className="lg-card" style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <TrendingUp size={16} color="var(--ledger-green)" />
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>Revenue, last 6 months</div>
        </div>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4E8A66" />
                  <stop offset="100%" stopColor="#2F5540" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5B6472" }} axisLine={{ stroke: "#E4DECF" }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#5B6472" }} axisLine={false} tickLine={false} width={50} />
              <Tooltip formatter={(v) => money(v, symbol)} contentStyle={{ fontSize: 12, fontFamily: "Inter", borderRadius: 8, border: "1px solid #E4DECF" }} cursor={{ fill: "#F7F3EA" }} />
              <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="lg-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={16} color="var(--ink-soft)" />
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>Recent invoices</div>
          </div>
          {recent.length > 0 && (
            <button className="lg-btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => navigate("/reports")}>
              View reports <ArrowRight size={12} />
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <div style={{ textAlign: "center", padding: "36px 16px", border: "1.5px dashed var(--line)", borderRadius: 8 }}>
            <FileText size={28} color="var(--line)" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>No invoices yet — create your first one above.</div>
          </div>
        ) : (
          <table className="lg-table">
            <thead><tr><th>Number</th><th>Client</th><th>Due</th><th>Status</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
            <tbody>
              {recent.map((inv) => {
                const clientName = clientsById[inv.clientId]?.name || "Deleted client";
                return (
                  <tr key={inv.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/invoices/edit/${inv.id}`)}>
                    <td className="lg-mono">{inv.number}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--paper-dark)", color: "var(--ink-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {clientName.charAt(0).toUpperCase()}
                        </div>
                        {clientName}
                      </div>
                    </td>
                    <td>{fmtDate(inv.dueDate)}</td>
                    <td><Stamp status={displayStatus(inv)} /></td>
                    <td className="lg-mono" style={{ textAlign: "right" }}>{money(computeTotals(inv).total, symbol)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}