import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  BarChart3, 
  Wallet, 
  TrendingUp, 
  IndianRupee,
  Building2,
  FileText, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import Metric from "./Metric";
import Stamp from "./Stamp";
import { todayISO, displayStatus, computeTotals, money, fmtDate, resolveProfile } from "../utils/helpers";

// Compact Indian-style number formatting for the chart's value axis
// (₹1,00,00,000 -> 1.0Cr, ₹1,50,000 -> 1.5L, ₹25,000 -> 25K) so large
// totals never get clipped inside the axis column.
const formatAxisValue = (value) => {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  if (abs >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (abs >= 1_00_000) return `${(n / 1_00_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

export default function Dashboard({ data = {}, clientsById = {} }) {
  const navigate = useNavigate();
  const symbol = data?.settings?.currencySymbol || "₹";
  const invoices = data?.invoices || [];
  const profiles = data?.profiles || [];

  const outstanding = invoices.filter((i) => displayStatus(i) === "sent" || displayStatus(i) === "overdue");
  const outstandingTotal = outstanding.reduce((s, i) => s + computeTotals(i).total, 0);

  // Total revenue: value of every non-draft invoice raised (matches the
  // same "exclude drafts" rule the analytics chart below already uses).
  const totalRevenue = invoices
    .filter((i) => i.status !== "draft")
    .reduce((s, i) => s + computeTotals(i).total, 0);

  // Invoice count grouped by the company profile that issued it, e.g.
  // [{ name: "Acme Co", count: 10 }, { name: "Beta LLC", count: 5 }, ...]
  const companyInvoiceCounts = useMemo(() => {
    const counts = new Map();
    invoices.forEach((inv) => {
      const profile = resolveProfile(profiles, inv.companyProfileId);
      const name = profile?.name || "No company profile";
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [invoices, profiles]);

  // Fixed Monthly Analytics Data Calculation
  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      months.push({ 
        key: `${year}-${month}`, 
        label: d.toLocaleDateString(undefined, { month: "short" }) 
      });
    }

    return months.map((m) => {
      // Include all valid issued or paid invoices for chart visualization
      const total = invoices
        .filter((i) => {
          const dateStr = i.issueDate || i.paidDate || i.createdAt || "";
          return dateStr.slice(0, 7) === m.key && i.status !== "draft";
        })
        .reduce((sum, inv) => sum + (computeTotals(inv).total || 0), 0);

      return { name: m.label, revenue: Math.round(total * 100) / 100 };
    });
  }, [invoices]);

  // The last bucket in chartData is always the current month.
  const monthlyRevenue = chartData.length ? chartData[chartData.length - 1].revenue : 0;

  const recent = [...invoices].sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || "")).slice(0, 6);
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="dash-shell" style={{ background: "#FAFAFA", minHeight: "100vh", padding: "24px 32px", borderRadius: 12 }}>
      
      {/* Header Section */}
      <div className="resp-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ledger-green)", background: "#E8F1EB", padding: "2px 8px", borderRadius: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Overview
            </span>
            <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>{today}</span>
          </div>
          <h1 className="lg-display" style={{ fontSize: 32, fontWeight: 700, margin: 0, color: "var(--ink)" }}>
            Dashboard
          </h1>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button 
            className="lg-btn-ghost" 
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 8, transition: "all 0.2s" }}
            onClick={() => navigate("/reports")}
          >
            <BarChart3 size={15} /> Reports
          </button>
          <button 
            className="lg-btn" 
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", transition: "all 0.2s" }}
            onClick={() => navigate("/invoices/new")}
          >
            <Plus size={16} /> New invoice
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
        <div style={{ transition: "transform 0.2s, box-shadow 0.2s", borderRadius: 12 }} className="metric-card-hover">
          <Metric icon={Wallet} label="Outstanding" value={money(outstandingTotal, symbol)} accent="var(--gold)" tint="#FBF1DE" />
        </div>
        <div style={{ transition: "transform 0.2s, box-shadow 0.2s", borderRadius: 12 }} className="metric-card-hover">
          <Metric icon={TrendingUp} label="Monthly Revenue" value={money(monthlyRevenue, symbol)} accent="var(--ledger-green)" tint="#E8F1EB" />
        </div>
        <div style={{ transition: "transform 0.2s, box-shadow 0.2s", borderRadius: 12 }} className="metric-card-hover">
          <Metric icon={IndianRupee} label="Total Revenue" value={money(totalRevenue, symbol)} accent="var(--ink)" tint="#F0EFEC" />
        </div>
        <div style={{ transition: "transform 0.2s, box-shadow 0.2s", borderRadius: 12 }} className="metric-card-hover">
          <Metric
            icon={Building2}
            label="Invoices by Company"
            accent="var(--stamp-red)"
            tint="#FBE9E6"
            value={
              companyInvoiceCounts.length === 0 ? (
                <span style={{ fontSize: 15, fontWeight: 500, color: "var(--ink-soft)" }}>No invoices yet</span>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {companyInvoiceCounts.slice(0, 3).map((c) => (
                    <div key={c.name} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--ink-soft)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {c.name}
                      </span>
                      <span className="lg-mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", flexShrink: 0 }}>
                        {c.count}
                      </span>
                    </div>
                  ))}
                  {companyInvoiceCounts.length > 3 && (
                    <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                      +{companyInvoiceCounts.length - 3} more
                    </div>
                  )}
                </div>
              )
            }
          />
        </div>
      </div>

      {/* Analytics Chart Section */}
      <div className="lg-card" style={{ marginBottom: 28, background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "#E8F1EB", padding: 8, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={18} color="var(--ledger-green)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>Revenue Analytics</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Monthly performance (Last 6 months)</div>
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ledger-green)", background: "#E8F1EB", padding: "4px 10px", borderRadius: 6 }}>
            Live Data
          </div>
        </div>

        <div style={{ height: 220, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4E8A66" stopOpacity={1} />
                  <stop offset="100%" stopColor="#2F5540" stopOpacity={0.95} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#F0EFEC" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#71717A" }} axisLine={{ stroke: "#E4DECF" }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: "#71717A" }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={formatAxisValue}
                allowDecimals={false}
              />
              <Tooltip 
                formatter={(v) => [money(v, symbol), "Revenue"]} 
                contentStyle={{ 
                  fontSize: 13, 
                  fontFamily: "Inter, sans-serif", 
                  borderRadius: 10, 
                  border: "1px solid #E4DECF",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                  background: "#fff"
                }} 
                cursor={{ fill: "#F7F5F0", opacity: 0.7 }} 
              />
              <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Invoices Table Section */}
      <div className="lg-card" style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "#F0EFEC", padding: 8, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={18} color="var(--ink)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>Recent Invoices</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Latest active transactions and billing</div>
            </div>
          </div>
          {recent.length > 0 && (
            <button 
              className="lg-btn-ghost" 
              style={{ padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6, borderRadius: 6 }} 
              onClick={() => navigate("/reports")}
            >
              View all <ArrowRight size={13} />
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px", border: "1.5px dashed var(--line)", borderRadius: 10, background: "#FAFAFA" }}>
            <Sparkles size={32} color="var(--line)" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>No invoices found</div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Create your first invoice to begin tracking payments.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="lg-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px" }}>
              <thead>
                <tr style={{ color: "var(--ink-soft)", fontSize: 12, textAlign: "left" }}>
                  <th style={{ padding: "8px 12px" }}>Invoice</th>
                  <th style={{ padding: "8px 12px" }}>Client</th>
                  <th style={{ padding: "8px 12px" }}>Due Date</th>
                  <th style={{ padding: "8px 12px" }}>Status</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((inv) => {
                  const clientName = clientsById[inv.clientId]?.name || "Deleted client";
                  return (
                    <tr 
                      key={inv.id} 
                      style={{ cursor: "pointer", transition: "background 0.15s" }} 
                      className="table-row-hover"
                      onClick={() => navigate(`/invoices/edit/${inv.id}`)}
                    >
                      <td className="lg-mono" style={{ padding: "12px", fontWeight: 600, fontSize: 13, borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }}>
                        {inv.number}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ 
                            width: 28, 
                            height: 28, 
                            borderRadius: "50%", 
                            background: "#EBE8E1", 
                            color: "#4A525D", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            fontSize: 12, 
                            fontWeight: 700, 
                            flexShrink: 0 
                          }}>
                            {clientName.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 500, fontSize: 13, color: "var(--ink)" }}>{clientName}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px", fontSize: 13, color: "var(--ink-soft)" }}>
                        {fmtDate(inv.dueDate)}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <Stamp status={displayStatus(inv)} />
                      </td>
                      <td className="lg-mono" style={{ padding: "12px", textAlign: "right", fontWeight: 600, fontSize: 13, borderTopRightRadius: 8, borderBottomRightRadius: 8 }}>
                        {money(computeTotals(inv).total, symbol)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}