import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, Users, Package, Repeat, Settings as SettingsIcon, Building2,
} from "lucide-react";
import NavItem from "./Components/NavItem";
import Dashboard from "./Components/Dashboard";
import Invoices from "./Components/Invoices";
import Clients from "./Components/Clients";
import CompanyProfiles from "./Components/CompanyProfiles";
import Items from "./Components/Items";
import Recurring from "./Components/Recurring";
import Reports from "./Components/Reports";
import Settings from "./Components/Settings";
import { STORAGE_KEY, DEFAULT_DATA, uid, todayISO, addDays, addInterval } from "./utils/helpers";
import "./App.css";

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_DATA, ...parsed, business: { ...DEFAULT_DATA.business, ...parsed.business }, businessProfiles: parsed.businessProfiles || [] };
    }
  } catch (e) {}
  return DEFAULT_DATA;
}

export default function App() {
  const [data, setData] = useState(loadInitial);
  const [saveError, setSaveError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  function persist(next) {
    setData(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaveError(false);
    } catch (e) {
      setSaveError(true);
    }
  }

  const clientsById = useMemo(() => Object.fromEntries(data.clients.map((c) => [c.id, c])), [data.clients]);

  // Clients
  const saveClient = (client) => {
    const exists = data.clients.some((c) => c.id === client.id);
    const clients = exists ? data.clients.map((c) => (c.id === client.id ? client : c)) : [...data.clients, client];
    persist({ ...data, clients });
  };
  const deleteClient = (id) => {
    if (data.invoices.some((i) => i.clientId === id)) {
      if (!confirm("This client has invoices. Delete anyway? Their invoices will keep showing the client name as 'deleted client'.")) return;
    }
    persist({ ...data, clients: data.clients.filter((c) => c.id !== id) });
  };

  // Items
  const saveItem = (item) => {
    const exists = data.items.some((i) => i.id === item.id);
    const items = exists ? data.items.map((i) => (i.id === item.id ? item : i)) : [...data.items, item];
    persist({ ...data, items });
  };
  const deleteItem = (id) => persist({ ...data, items: data.items.filter((i) => i.id !== id) });

  // Invoices
  const saveInvoice = (inv, isNew) => {
    let next = { ...data };
    if (isNew) {
      if (!inv.companyProfileId) {
        next.business = { ...next.business, nextNumber: next.business.nextNumber + 1 };
      } else {
        next.businessProfiles = next.businessProfiles.map((p) => (p.id === inv.companyProfileId ? { ...p, nextNumber: p.nextNumber + 1 } : p));
      }
      next.invoices = [...next.invoices, inv];
    } else {
      next.invoices = next.invoices.map((i) => (i.id === inv.id ? inv : i));
    }
    persist(next);
  };
  const deleteInvoice = (id) => {
    if (!confirm("Delete this invoice?")) return;
    persist({ ...data, invoices: data.invoices.filter((i) => i.id !== id) });
  };
  const setStatus = (id, status) => {
    const invoices = data.invoices.map((i) => (i.id === id ? { ...i, status, paidDate: status === "paid" ? todayISO() : i.paidDate } : i));
    persist({ ...data, invoices });
  };

  // Recurring
  const saveRecurring = (r, isNew) => {
    const recurring = isNew ? [...data.recurring, r] : data.recurring.map((x) => (x.id === r.id ? r : x));
    persist({ ...data, recurring });
  };
  const deleteRecurring = (id) => persist({ ...data, recurring: data.recurring.filter((r) => r.id !== id) });
  const generateFromRecurring = (r) => {
    const inv = {
      id: uid("inv"),
      number: `${data.business.prefix}-${data.business.nextNumber}`,
      clientId: r.clientId,
      issueDate: todayISO(),
      dueDate: addDays(todayISO(), 15),
      lineItems: r.lineItems.map((li) => ({ ...li, id: uid("li") })),
      taxRate: r.taxRate,
      notes: r.notes || "",
      status: "draft",
      paidDate: null,
      fromRecurringId: r.id,
    };
    persist({
      ...data,
      business: { ...data.business, nextNumber: data.business.nextNumber + 1 },
      invoices: [...data.invoices, inv],
      recurring: data.recurring.map((x) => (x.id === r.id ? { ...x, nextDate: addInterval(x.nextDate, x.frequency), lastGenerated: todayISO() } : x)),
    });
    navigate("/invoices");
  };

  // Settings / profiles
  const saveBusiness = (b) => persist({ ...data, business: b });
  const saveBusinessProfile = (profile) => {
    const exists = data.businessProfiles.some((p) => p.id === profile.id);
    const businessProfiles = exists ? data.businessProfiles.map((p) => (p.id === profile.id ? profile : p)) : [...data.businessProfiles, profile];
    persist({ ...data, businessProfiles });
  };
  const deleteBusinessProfile = (id) => {
    if (!confirm("Delete this company profile? Past invoices will keep showing its saved details.")) return;
    persist({ ...data, businessProfiles: data.businessProfiles.filter((p) => p.id !== id) });
  };

  const hidingChrome = location.pathname.startsWith("/print");

  return (
    <div style={{ "--ink": "#1F2A3C", "--ink-soft": "#5B6472", "--paper": "#FFFFFF", "--paper-dark": "#F3EEE1", "--stamp-red": "#A33B2E", "--ledger-green": "#3F6B4F", "--gold": "#A8791F", "--line": "#E4DECF" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@400;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .lg-app * { box-sizing: border-box; }
        .lg-app { font-family: 'Inter', sans-serif; color: var(--ink); background: var(--paper); }
        .lg-display { font-family: 'Zilla Slab', serif; }
        .lg-mono { font-family: 'IBM Plex Mono', monospace; }
        .lg-app input, .lg-app select, .lg-app textarea {
          font-family: 'Inter', sans-serif; font-size: 14px; padding: 8px 10px;
          border: 1px solid var(--line); border-radius: 4px; background: #fff; color: var(--ink); width: 100%;
        }
        .lg-app input:focus, .lg-app select:focus, .lg-app textarea:focus { outline: 2px solid var(--ink); outline-offset: 1px; }
        .lg-app button { font-family: 'Inter', sans-serif; cursor: pointer; }
        .lg-btn { border: 1px solid var(--ink); background: var(--ink); color: var(--paper); padding: 9px 16px; border-radius: 4px; font-size: 13px; font-weight: 600; letter-spacing: 0.02em; display: inline-flex; align-items: center; gap: 6px; }
        .lg-btn:hover { opacity: 0.85; }
        .lg-btn-ghost { border: 1px solid var(--line); background: transparent; color: var(--ink); padding: 8px 14px; border-radius: 4px; font-size: 13px; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; }
        .lg-btn-ghost:hover { background: var(--paper-dark); }
        .lg-btn-danger { border: 1px solid var(--stamp-red); background: transparent; color: var(--stamp-red); padding: 6px 10px; border-radius: 4px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; }
        .lg-card { background: #fff; border: 1px solid var(--line); border-radius: 8px; padding: 18px; box-shadow: 0 1px 2px rgba(31,42,58,0.04), 0 1px 8px rgba(31,42,58,0.03); }
        .lg-metric { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .lg-metric:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(31,42,58,0.08); }
        .lg-tab { display: flex; align-items: center; gap: 10px; padding: 11px 16px; border-radius: 4px; font-size: 14px; font-weight: 500; color: var(--ink-soft); cursor: pointer; border: none; background: transparent; width: 100%; text-align: left; }
        .lg-tab:hover { background: var(--paper-dark); color: var(--ink); }
        .lg-tab.active { background: var(--ink); color: var(--paper); }
        .lg-row-line { border-bottom: 1px solid var(--line); }
        table.lg-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        table.lg-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-soft); padding: 8px 10px; border-bottom: 2px solid var(--ink); }
        table.lg-table td { padding: 10px; border-bottom: 1px solid var(--line); vertical-align: middle; }
        table.lg-table tr:hover td { background: var(--paper-dark); }
        @media print {
          .lg-noprint { display: none !important; }
          .lg-print-area { display: block !important; }
          body { background: white; }
          .lg-print-area, .lg-print-area * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        }
      `}</style>

      <div className="lg-app" style={{ display: "flex", minHeight: 600, borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)" }}>
        {!hidingChrome && (
          <div style={{ width: 210, background: "var(--paper-dark)", borderRight: "1px solid var(--line)", padding: 16, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ padding: "6px 10px 18px" }}>
              <div className="lg-display" style={{ fontSize: 20, fontWeight: 700 }}>Ledger</div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{data.business.name}</div>
            </div>
            <NavItem icon={LayoutDashboard} label="Dashboard" path="/" />
            <NavItem icon={FileText} label="Invoices" path="/invoices" />
            <NavItem icon={Users} label="Clients" path="/clients" />
            <NavItem icon={Building2} label="Company profiles" path="/profiles" />
            <NavItem icon={Package} label="Items" path="/items" />
            <NavItem icon={Repeat} label="Recurring" path="/recurring" />
            <NavItem icon={SettingsIcon} label="Settings" path="/settings" />
            {saveError && (
              <div style={{ marginTop: "auto", fontSize: 11, color: "var(--stamp-red)", padding: 8 }}>
                Couldn't save changes. Try again.
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1, padding: 24, overflow: "auto" }}>
          <Routes>
            <Route path="/" element={<Dashboard data={data} clientsById={clientsById} />} />
            <Route path="/invoices/*" element={<Invoices data={data} clientsById={clientsById} onDelete={deleteInvoice} onSetStatus={setStatus} onSaveInvoice={saveInvoice} />} />
            <Route path="/clients" element={<Clients clients={data.clients} invoices={data.invoices} onSave={saveClient} onDelete={deleteClient} />} />
            <Route path="/profiles" element={<CompanyProfiles business={data.business} profiles={data.businessProfiles} onSave={saveBusinessProfile} onDelete={deleteBusinessProfile} />} />
            <Route path="/items" element={<Items items={data.items} business={data.business} onSave={saveItem} onDelete={deleteItem} />} />
            <Route path="/recurring" element={<Recurring data={data} clientsById={clientsById} onSave={saveRecurring} onDelete={deleteRecurring} onGenerate={generateFromRecurring} />} />
            <Route path="/reports" element={<Reports data={data} clientsById={clientsById} />} />
            <Route path="/settings" element={<Settings business={data.business} onSave={saveBusiness} />} />
            <Route path="*" element={<Dashboard data={data} clientsById={clientsById} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}