import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, Users, Package, Repeat, Settings as SettingsIcon, Building2, LogOut,
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
import Login from "./Components/Login";
import { api } from "./utils/api";
import "./App.css";

const EMPTY_DATA = { settings: { sendEmailOnInvoiceCreate: true, currencySymbol: "₹" }, profiles: [], clients: [], items: [], invoices: [], recurring: [] };

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function loadAll() {
    setLoading(true);
    try {
      const [clients, items, profiles, settings, invoices, recurring] = await Promise.all([
        api.clients.list(), api.items.list(), api.profiles.list(), api.auth.me(), api.invoices.list(), api.recurring.list(),
      ]);
      setData({ settings, profiles, clients, items, invoices, recurring });
      setSaveError(false);
    } catch (e) {
      setSaveError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.auth.me()
      .then(() => { setAuthed(true); return loadAll(); })
      .catch(() => setAuthed(false))
      .finally(() => setAuthChecked(true));
  }, []);

  const clientsById = useMemo(() => Object.fromEntries(data.clients.map((c) => [c.id, c])), [data.clients]);

  const withErrorHandling = (fn) => async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      setSaveError(true);
      alert(e.message || "Something went wrong talking to the server.");
    }
  };

  // Clients
  const saveClient = withErrorHandling(async (client) => {
    const exists = data.clients.some((c) => c.id === client.id);
    const saved = exists ? await api.clients.update(client.id, client) : await api.clients.create(client);
    setData((d) => ({ ...d, clients: exists ? d.clients.map((c) => (c.id === saved.id ? saved : c)) : [...d.clients, saved] }));
  });
  const deleteClient = withErrorHandling(async (id) => {
    if (data.invoices.some((i) => i.clientId === id)) {
      if (!confirm("This client has invoices. Delete anyway? Their invoices will keep showing the client name as 'deleted client'.")) return;
    }
    await api.clients.remove(id);
    setData((d) => ({ ...d, clients: d.clients.filter((c) => c.id !== id) }));
  });

  // Items
  const saveItem = withErrorHandling(async (item) => {
    const exists = data.items.some((i) => i.id === item.id);
    const saved = exists ? await api.items.update(item.id, item) : await api.items.create(item);
    setData((d) => ({ ...d, items: exists ? d.items.map((i) => (i.id === saved.id ? saved : i)) : [...d.items, saved] }));
  });
  const deleteItem = withErrorHandling(async (id) => {
    await api.items.remove(id);
    setData((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }));
  });

  // Invoices
  const saveInvoice = withErrorHandling(async (inv, isNew) => {
    const saved = isNew ? await api.invoices.create(inv) : await api.invoices.update(inv.id, inv);
    setData((d) => ({
      ...d,
      invoices: isNew ? [...d.invoices, saved] : d.invoices.map((i) => (i.id === saved.id ? saved : i)),
    }));
  });
  const deleteInvoice = withErrorHandling(async (id) => {
    if (!confirm("Delete this invoice?")) return;
    await api.invoices.remove(id);
    setData((d) => ({ ...d, invoices: d.invoices.filter((i) => i.id !== id) }));
  });
  const setStatus = withErrorHandling(async (id, status) => {
    const inv = data.invoices.find((i) => i.id === id);
    const saved = await api.invoices.update(id, { ...inv, status });
    setData((d) => ({ ...d, invoices: d.invoices.map((i) => (i.id === id ? saved : i)) }));
  });

  // Recurring
  const saveRecurring = withErrorHandling(async (r, isNew) => {
    const saved = isNew ? await api.recurring.create(r) : await api.recurring.update(r.id, r);
    setData((d) => ({ ...d, recurring: isNew ? [...d.recurring, saved] : d.recurring.map((x) => (x.id === saved.id ? saved : x)) }));
  });
  const deleteRecurring = withErrorHandling(async (id) => {
    await api.recurring.remove(id);
    setData((d) => ({ ...d, recurring: d.recurring.filter((r) => r.id !== id) }));
  });
  const generateFromRecurring = withErrorHandling(async (r) => {
    const { invoice, recurring } = await api.recurring.generate(r.id);
    setData((d) => ({
      ...d,
      invoices: [...d.invoices, invoice],
      recurring: d.recurring.map((x) => (x.id === recurring.id ? recurring : x)),
    }));
    navigate("/invoices");
  });

  // Settings / company profiles
  const saveSettings = withErrorHandling(async (s) => {
    const saved = await api.auth.updateSettings(s);
    setData((d) => ({ ...d, settings: saved }));
  });
  const saveCompanyProfile = withErrorHandling(async (profile) => {
    const exists = data.profiles.some((p) => p.id === profile.id);
    const saved = exists ? await api.profiles.update(profile.id, profile) : await api.profiles.create(profile);
    setData((d) => ({ ...d, profiles: exists ? d.profiles.map((p) => (p.id === saved.id ? saved : p)) : [...d.profiles, saved] }));
  });
  const deleteCompanyProfile = withErrorHandling(async (id) => {
    if (!confirm("Delete this company profile? Past invoices will keep showing its saved details.")) return;
    await api.profiles.remove(id);
    setData((d) => ({ ...d, profiles: d.profiles.filter((p) => p.id !== id) }));
  });

  const logout = async () => {
    try { await api.auth.logout(); } catch (e) {}
    setAuthed(false);
    setData(EMPTY_DATA);
    navigate("/"); // clear any deep route (e.g. /print, /invoices/edit/:id) so the login screen renders cleanly
  };

  const hidingChrome = location.pathname.startsWith("/print");

  const themeVars = { "--ink": "#1F2A3C", "--ink-soft": "#5B6472", "--paper": "#FFFFFF", "--paper-dark": "#F3EEE1", "--stamp-red": "#A33B2E", "--ledger-green": "#3F6B4F", "--gold": "#A8791F", "--line": "#E4DECF" };
  const globalStyle = `
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
      `;

  if (!authChecked) {
    return (
      <div style={themeVars}>
        <style>{globalStyle}</style>
        <div className="lg-app" style={{ padding: 40, textAlign: "center", fontSize: 13, color: "var(--ink-soft)" }}>Loading…</div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={themeVars}>
        <style>{globalStyle}</style>
        <div className="lg-app">
          <Login onAuthed={() => { setAuthed(true); loadAll(); }} />
        </div>
      </div>
    );
  }

  return (
    <div style={themeVars}>
      <style>{globalStyle}</style>

      <div className="lg-app" style={{ display: "flex", minHeight: 600, borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)" }}>
        {!hidingChrome && (
          <div style={{ width: 210, background: "var(--paper-dark)", borderRight: "1px solid var(--line)", padding: 16, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ padding: "6px 10px 18px" }}>
              <div className="lg-display" style={{ fontSize: 20, fontWeight: 700 }}>Ledger</div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{data.settings.email}</div>
            </div>
            <NavItem icon={LayoutDashboard} label="Dashboard" path="/" />
            <NavItem icon={FileText} label="Invoices" path="/invoices" />
            <NavItem icon={Users} label="Clients" path="/clients" />
            <NavItem icon={Building2} label="Company profiles" path="/profiles" />
            <NavItem icon={Package} label="Items" path="/items" />
            <NavItem icon={Repeat} label="Recurring" path="/recurring" />
            <NavItem icon={SettingsIcon} label="Settings" path="/settings" />
            <button className="lg-tab" style={{ marginTop: "auto" }} onClick={logout}><LogOut size={16} /> Log out</button>
            {saveError && (
              <div style={{ fontSize: 11, color: "var(--stamp-red)", padding: 8 }}>
                Couldn't reach the server. Try again.
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1, padding: 24, overflow: "auto" }}>
          {loading ? (
            <div style={{ padding: 24, fontSize: 13, color: "var(--ink-soft)" }}>Loading…</div>
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard data={data} clientsById={clientsById} />} />
              <Route path="/invoices/*" element={<Invoices data={data} clientsById={clientsById} onDelete={deleteInvoice} onSetStatus={setStatus} onSaveInvoice={saveInvoice} />} />
              <Route path="/clients" element={<Clients clients={data.clients} invoices={data.invoices} onSave={saveClient} onDelete={deleteClient} />} />
              <Route path="/profiles" element={<CompanyProfiles profiles={data.profiles} onSave={saveCompanyProfile} onDelete={deleteCompanyProfile} />} />
              <Route path="/items" element={<Items items={data.items} settings={data.settings} onSave={saveItem} onDelete={deleteItem} />} />
              <Route path="/recurring" element={<Recurring data={data} clientsById={clientsById} onSave={saveRecurring} onDelete={deleteRecurring} onGenerate={generateFromRecurring} />} />
              <Route path="/reports" element={<Reports data={data} clientsById={clientsById} />} />
              <Route path="/settings" element={<Settings settings={data.settings} onSave={saveSettings} />} />
              <Route path="*" element={<Dashboard data={data} clientsById={clientsById} />} />
            </Routes>
          )}
        </div>
      </div>
    </div>
  );
}