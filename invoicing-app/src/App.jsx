import React, { useState, useEffect, useMemo } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  LayoutDashboard,
  FileText,
  ReceiptText,
  BarChart2,
  Users,
  Package,
  Repeat,
  Settings as SettingsIcon,
  Building2,
  LogOut,
  Menu,
  X,
  HandCoins,
} from "lucide-react";

import NavItem from "./Components/NavItem";
import Dashboard from "./Components/Dashboard";
import Invoices from "./Components/Invoices";
import PurchaseInvoices from "./Components/PurchaseInvoices";
import Clients from "./Components/Clients";
import CompanyProfiles from "./Components/CompanyProfiles";
import Items from "./Components/Items";
import Recurring from "./Components/Recurring";
import Reports from "./Components/Reports";
import Settings from "./Components/Settings";
import Login from "./Components/Login";
import CommissionEntries from "./Components/CommissionEntries";

import { api } from "./utils/api";

import "./App.css";


const EMPTY_DATA = {
  settings: {
    sendEmailOnInvoiceCreate: true,
    currencySymbol: "₹",
  },
  profiles: [],
  clients: [],
  items: [],
  invoices: [],
  purchaseInvoices: [],
  commissions: [],
  recurring: [],
};


export default function App() {

  const [authChecked, setAuthChecked] =
    useState(false);

  const [authed, setAuthed] =
    useState(false);

  const [data, setData] =
    useState(EMPTY_DATA);

  const [loading, setLoading] =
    useState(false);

  const [saveError, setSaveError] =
    useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);


  // ==========================================================
  // LOAD ALL DATA
  // ==========================================================

  async function loadAll() {

    setLoading(true);

    try {

      const [
        clients,
        items,
        profiles,
        settings,
        invoices,
        purchaseInvoices,
        commissions,
        recurring,
      ] = await Promise.all([
        api.clients.list(),
        api.items.list(),
        api.profiles.list(),
        api.auth.me(),
        api.invoices.list(),
        api.purchaseInvoices.list(),
        api.commissions.list(),
        api.recurring.list(),
      ]);

      setData({
        settings,
        profiles,
        clients,
        items,
        invoices,
        purchaseInvoices,
        commissions,
        recurring,
      });

      setSaveError(false);

    } catch (e) {

      setSaveError(true);

    } finally {

      setLoading(false);

    }
  }


  // ==========================================================
  // AUTH CHECK
  // ==========================================================

  useEffect(() => {

    api.auth.me()

      .then(() => {

        setAuthed(true);

        return loadAll();

      })

      .catch(() => {

        setAuthed(false);

      })

      .finally(() => {

        setAuthChecked(true);

      });

  }, []);


  // ==========================================================
  // CLIENT LOOKUP
  // ==========================================================

  const clientsById = useMemo(
    () =>
      Object.fromEntries(
        data.clients.map((c) => [
          c.id,
          c,
        ])
      ),
    [data.clients]
  );


  // ==========================================================
  // ERROR HANDLER
  // ==========================================================

  const withErrorHandling =
    (fn) =>
    async (...args) => {

      try {

        return await fn(...args);

      } catch (e) {

        setSaveError(true);

        alert(
          e.message ||
            "Something went wrong talking to the server."
        );

      }
    };


  // ==========================================================
  // CLIENTS
  // ==========================================================

  const saveClient =
    withErrorHandling(
      async (client) => {

        const exists =
          data.clients.some(
            (c) =>
              c.id === client.id
          );

        const saved = exists
          ? await api.clients.update(
              client.id,
              client
            )
          : await api.clients.create(
              client
            );

        setData((d) => ({
          ...d,

          clients: exists
            ? d.clients.map((c) =>
                c.id === saved.id
                  ? saved
                  : c
              )
            : [
                ...d.clients,
                saved,
              ],
        }));

      }
    );


  const deleteClient =
    withErrorHandling(
      async (id) => {

        if (
          data.invoices.some(
            (i) =>
              i.clientId === id
          )
        ) {

          if (
            !confirm(
              "This client has invoices. Delete anyway? Their invoices will keep showing the client name as 'deleted client'."
            )
          ) {

            return;

          }

        }

        await api.clients.remove(id);

        setData((d) => ({
          ...d,

          clients:
            d.clients.filter(
              (c) =>
                c.id !== id
            ),
        }));

      }
    );


  // ==========================================================
  // ITEMS
  // ==========================================================

  const saveItem =
    withErrorHandling(
      async (item) => {

        const exists =
          data.items.some(
            (i) =>
              i.id === item.id
          );

        const saved = exists
          ? await api.items.update(
              item.id,
              item
            )
          : await api.items.create(
              item
            );

        setData((d) => ({
          ...d,

          items: exists
            ? d.items.map((i) =>
                i.id === saved.id
                  ? saved
                  : i
              )
            : [
                ...d.items,
                saved,
              ],
        }));

      }
    );


  const deleteItem =
    withErrorHandling(
      async (id) => {

        await api.items.remove(id);

        setData((d) => ({
          ...d,

          items:
            d.items.filter(
              (i) =>
                i.id !== id
            ),
        }));

      }
    );


  // ==========================================================
  // INVOICES
  // ==========================================================

  const saveInvoice =
    withErrorHandling(
      async (inv, isNew) => {

        const saved = isNew
          ? await api.invoices.create(
              inv
            )
          : await api.invoices.update(
              inv.id,
              inv
            );

        setData((d) => ({
          ...d,

          invoices: isNew
            ? [
                ...d.invoices,
                saved,
              ]
            : d.invoices.map(
                (i) =>
                  i.id === saved.id
                    ? saved
                    : i
              ),
        }));

      }
    );


  const deleteInvoice =
    withErrorHandling(
      async (id) => {

        if (
          !confirm(
            "Delete this invoice?"
          )
        ) {

          return;

        }

        await api.invoices.remove(id);

        setData((d) => ({
          ...d,

          invoices:
            d.invoices.filter(
              (i) =>
                i.id !== id
            ),
        }));

      }
    );


  const setStatus =
    withErrorHandling(
      async (
        id,
        status
      ) => {

        const inv =
          data.invoices.find(
            (i) =>
              i.id === id
          );

        const saved =
          await api.invoices.update(
            id,
            {
              ...inv,
              status,
            }
          );

        setData((d) => ({
          ...d,

          invoices:
            d.invoices.map(
              (i) =>
                i.id === id
                  ? saved
                  : i
            ),
        }));

      }
    );


  // ==========================================================
  // PURCHASE INVOICES
  // ==========================================================

  const savePurchaseInvoice =
    withErrorHandling(
      async (pi) => {

        const exists =
          data.purchaseInvoices.some(
            (p) =>
              p.id === pi.id
          );

        const saved = exists
          ? await api.purchaseInvoices.update(
              pi.id,
              pi
            )
          : await api.purchaseInvoices.create(
              pi
            );

        setData((d) => ({
          ...d,

          purchaseInvoices: exists
            ? d.purchaseInvoices.map((p) =>
                p.id === saved.id
                  ? saved
                  : p
              )
            : [
                ...d.purchaseInvoices,
                saved,
              ],
        }));

      }
    );


  const deletePurchaseInvoice =
    withErrorHandling(
      async (id) => {

        await api.purchaseInvoices.remove(id);

        setData((d) => ({
          ...d,

          purchaseInvoices:
            d.purchaseInvoices.filter(
              (p) =>
                p.id !== id
            ),
        }));

      }
    );

  const saveCommission = withErrorHandling(async (c) => {
    const exists = data.commissions.some((x) => x.id === c.id);
    const saved = exists
      ? await api.commissions.update(c.id, c)
      : await api.commissions.create(c);
    setData((d) => ({
      ...d,
      commissions: exists
        ? d.commissions.map((x) => (x.id === saved.id ? saved : x))
        : [...d.commissions, saved],
    }));
  });

  const deleteCommission = withErrorHandling(async (id) => {
    await api.commissions.remove(id);
    setData((d) => ({
      ...d,
      commissions: d.commissions.filter((x) => x.id !== id),
    }));
  });


  // ==========================================================
  // RECURRING
  // ==========================================================

  const saveRecurring =
    withErrorHandling(
      async (
        r,
        isNew
      ) => {

        const saved = isNew
          ? await api.recurring.create(
              r
            )
          : await api.recurring.update(
              r.id,
              r
            );

        setData((d) => ({
          ...d,

          recurring: isNew
            ? [
                ...d.recurring,
                saved,
              ]
            : d.recurring.map(
                (x) =>
                  x.id === saved.id
                    ? saved
                    : x
              ),
        }));

      }
    );


  const deleteRecurring =
    withErrorHandling(
      async (id) => {

        await api.recurring.remove(
          id
        );

        setData((d) => ({
          ...d,

          recurring:
            d.recurring.filter(
              (r) =>
                r.id !== id
            ),
        }));

      }
    );


  const generateFromRecurring =
    withErrorHandling(
      async (r) => {

        const {
          invoice,
          recurring,
        } =
          await api.recurring.generate(
            r.id
          );

        setData((d) => ({
          ...d,

          invoices: [
            ...d.invoices,
            invoice,
          ],

          recurring:
            d.recurring.map(
              (x) =>
                x.id ===
                recurring.id
                  ? recurring
                  : x
            ),
        }));

        navigate(
          "/invoices"
        );

      }
    );


  // ==========================================================
  // SETTINGS
  // ==========================================================

  const saveSettings =
    withErrorHandling(
      async (s) => {

        const saved =
          await api.auth.updateSettings(
            s
          );

        setData((d) => ({
          ...d,
          settings: saved,
        }));

      }
    );


  // ==========================================================
  // COMPANY PROFILES
  // ==========================================================

  const saveCompanyProfile =
    withErrorHandling(
      async (profile) => {

        const exists =
          data.profiles.some(
            (p) =>
              p.id === profile.id
          );

        const saved = exists
          ? await api.profiles.update(
              profile.id,
              profile
            )
          : await api.profiles.create(
              profile
            );

        setData((d) => ({
          ...d,

          profiles: exists
            ? d.profiles.map(
                (p) =>
                  p.id === saved.id
                    ? saved
                    : p
              )
            : [
                ...d.profiles,
                saved,
              ],
        }));

      }
    );


  const deleteCompanyProfile =
    withErrorHandling(
      async (id) => {

        if (
          !confirm(
            "Delete this company profile? Past invoices will keep showing its saved details."
          )
        ) {

          return;

        }

        await api.profiles.remove(
          id
        );

        setData((d) => ({
          ...d,

          profiles:
            d.profiles.filter(
              (p) =>
                p.id !== id
            ),
        }));

      }
    );


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout =
    async () => {

      try {

        await api.auth.logout();

      } catch (e) {}

      setAuthed(false);

      setData(
        EMPTY_DATA
      );

      navigate("/");

    };


  // ==========================================================
  // PRINT PAGE
  // ==========================================================

  const hidingChrome =
    location.pathname.startsWith(
      "/print"
    );


  // ==========================================================
  // THEME
  // ==========================================================

  const themeVars = {

    "--ink": "#0F172A",

    "--ink-soft":
      "#64748B",

    "--paper":
      "#FFFFFF",

    "--paper-dark":
      "#F8FAFC",

    "--stamp-red":
      "#DC2626",

    "--ledger-green":
      "#2563EB",

    "--gold":
      "#D4A72C",

    "--line":
      "#E2E8F0",

  };


  // ==========================================================
  // GLOBAL STYLE
  // ==========================================================

  const globalStyle = `

    @import url(
      'https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@400;600;700&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
    );

    .lg-app * {
      box-sizing: border-box;
    }

    .lg-app {
      font-family:
        'Inter',
        sans-serif;

      color:
        var(--ink);

      background:
        var(--paper);
    }

    .lg-display {
      font-family:
        'Zilla Slab',
        serif;
    }

    .lg-mono {
      font-family:
        'IBM Plex Mono',
        monospace;
    }

    .lg-app input,
    .lg-app select,
    .lg-app textarea {

      font-family:
        'Inter',
        sans-serif;

      font-size:
        14px;

      padding:
        8px 10px;

      border:
        1px solid
        var(--line);

      border-radius:
        4px;

      background:
        #fff;

      color:
        var(--ink);

      width:
        100%;
    }

    .lg-app input:focus,
    .lg-app select:focus,
    .lg-app textarea:focus {

      outline:
        2px solid
        var(--ledger-green);

      outline-offset:
        1px;
    }

    .lg-app button {

      font-family:
        'Inter',
        sans-serif;

      cursor:
        pointer;
    }

    .lg-btn {

      border:
        1px solid
        var(--ink);

      background:
        var(--ink);

      color:
        var(--paper);

      padding:
        9px 16px;

      border-radius:
        4px;

      font-size:
        13px;

      font-weight:
        600;

      letter-spacing:
        0.02em;

      display:
        inline-flex;

      align-items:
        center;

      gap:
        6px;
    }

    .lg-btn:hover {
      opacity:
        .85;
    }

    .lg-btn-ghost {

      border:
        1px solid
        var(--line);

      background:
        transparent;

      color:
        var(--ink);

      padding:
        8px 14px;

      border-radius:
        4px;

      font-size:
        13px;

      font-weight:
        500;

      display:
        inline-flex;

      align-items:
        center;

      gap:
        6px;
    }

    .lg-btn-ghost:hover {

      background:
        var(--paper-dark);
    }

    .lg-btn-danger {

      border:
        1px solid
        var(--stamp-red);

      background:
        transparent;

      color:
        var(--stamp-red);

      padding:
        6px 10px;

      border-radius:
        4px;

      font-size:
        12px;

      display:
        inline-flex;

      align-items:
        center;

      gap:
        4px;
    }

    .lg-card {

      background:
        #fff;

      border:
        1px solid
        var(--line);

      border-radius:
        8px;

      padding:
        18px;

      box-shadow:
        0 1px 2px
        rgba(31,42,58,.04),
        0 1px 8px
        rgba(31,42,58,.03);
    }

    .lg-metric {

      transition:
        transform .15s ease,
        box-shadow .15s ease;
    }

    .lg-metric:hover {

      transform:
        translateY(-2px);

      box-shadow:
        0 4px 14px
        rgba(31,42,58,.08);
    }

    .lg-tab {

      display:
        flex;

      align-items:
        center;

      gap:
        10px;

      padding:
        10px 12px;

      border-radius:
        9px;

      font-size:
        13px;

      font-weight:
        600;

      color:
        #94A3B8;

      cursor:
        pointer;

      border:
        none;

      background:
        transparent;

      width:
        100%;

      text-align:
        left;

      transition:
        all .16s ease;
    }

    .lg-tab:hover {

      background:
        rgba(255,255,255,.06);

      color:
        #F8FAFC;
    }

    .lg-tab.active {

      background:
        #2563EB;

      color:
        #fff;

      box-shadow:
        0 7px 18px
        rgba(37,99,235,.22);
    }

    .lg-tab.active svg {
      color:
        #fff;
    }

    .lg-row-line {

      border-bottom:
        1px solid
        var(--line);
    }

    table.lg-table {

      width:
        100%;

      border-collapse:
        collapse;

      font-size:
        13px;
    }

    table.lg-table th {

      text-align:
        left;

      font-size:
        11px;

      text-transform:
        uppercase;

      letter-spacing:
        .08em;

      color:
        var(--ink-soft);

      padding:
        8px 10px;

      border-bottom:
        2px solid
        var(--ink);
    }

    table.lg-table td {

      padding:
        10px;

      border-bottom:
        1px solid
        var(--line);

      vertical-align:
        middle;
    }

    table.lg-table tr:hover td {

      background:
        var(--paper-dark);
    }

    @media print {

      .lg-noprint {
        display:
          none !important;
      }

      .lg-print-area {
        display:
          block !important;
      }

      body {
        background:
          white;
      }

      .lg-print-area,
      .lg-print-area * {

        -webkit-print-color-adjust:
          exact !important;

        print-color-adjust:
          exact !important;

        color-adjust:
          exact !important;
      }
    }

  `;


  // ==========================================================
  // AUTH LOADING
  // ==========================================================

  if (!authChecked) {

    return (
      <div style={themeVars}>

        <style>
          {globalStyle}
        </style>

        <div
          className="lg-app"
          style={{
            minHeight:
              "100svh",

            display:
              "grid",

            placeItems:
              "center",

            fontSize:
              13,

            color:
              "var(--ink-soft)",
          }}
        >
          Loading…
        </div>

      </div>
    );
  }


  // ==========================================================
  // LOGIN
  // ==========================================================

  if (!authed) {

    return (
      <div style={themeVars}>

        <style>
          {globalStyle}
        </style>

        <div className="lg-app">

          <Login
            onAuthed={() => {

              setAuthed(true);

              loadAll();

            }}
          />

        </div>

      </div>
    );
  }


  // ==========================================================
  // MAIN APP
  // ==========================================================

  return (

    <div style={themeVars}>

      <style>
        {globalStyle}
      </style>


      <div
        className="lg-app lg-app-shell"
        style={{
          display:
            "flex",

          minHeight:
            "100svh",

          width:
            "100%",

          borderRadius:
            0,

          overflow:
            "hidden",

          border:
            "none",
        }}
      >

        {/* ==================================================
            MOBILE NAVIGATION
            ================================================== */}

        {!hidingChrome && (
          <>
            <button
              type="button"
              className="lg-mobile-menu-button"
              aria-label={
                mobileSidebarOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={mobileSidebarOpen}
              onClick={() =>
                setMobileSidebarOpen(
                  (open) => !open
                )
              }
            >
              {mobileSidebarOpen ? (
                <X size={22} />
              ) : (
                <Menu size={22} />
              )}
            </button>

            {mobileSidebarOpen && (
              <button
                type="button"
                className="lg-mobile-sidebar-overlay"
                aria-label="Close navigation menu"
                onClick={() =>
                  setMobileSidebarOpen(false)
                }
              />
            )}
          </>
        )}


        {/* ==================================================
            SIDEBAR
            ================================================== */}

        {!hidingChrome && (

          <aside
            className={`lg-sidebar ${
              mobileSidebarOpen
                ? "mobile-open"
                : ""
            }`}
            style={{
              width:
                230,

              minWidth:
                230,

              height:
                "100vh",

              minHeight:
                "100vh",

              padding:
                "18px 13px",

              display:
                "flex",

              flexDirection:
                "column",

              gap:
                4,

              alignSelf:
                "stretch",

              position:
                "fixed",

              top:
                0,

              left:
                0,

              bottom:
                0,

              overflowY:
                "auto",

              overflowX:
                "hidden",

              flexShrink:
                0,
            }}
          >

            {/* BRAND */}

            <div className="lg-sidebar-brand">

              <div className="lg-brand-mark">

                <Building2
                  size={18}
                  strokeWidth={2.2}
                />

              </div>

              <div className="lg-brand-title-wrap">

                <div className="lg-display lg-brand-title">
                  BILLING SOFTWARE
                </div>

              </div>

            </div>


            {/* NAV */}

            <div className="lg-sidebar-section-label">
              MAIN MENU
            </div>


            <NavItem
              icon={LayoutDashboard}
              label="Dashboard"
              path="/"
            />

            <NavItem
              icon={FileText}
              label="Invoices"
              path="/invoices"
            />

            <NavItem
              icon={ReceiptText}
              label="Purchase Invoice"
              path="/purchase-invoices"
            />

            <NavItem
              icon={HandCoins}
              label="Commission Entry"
              path="/commission-entries"
            />

            <NavItem
              icon={BarChart2}
              label="Reports"
              path="/reports"
            />


            <div className="lg-sidebar-section-label lg-sidebar-section-gap">
              BUSINESS
            </div>


            <NavItem
              icon={Users}
              label="Clients"
              path="/clients"
            />

            <NavItem
              icon={Building2}
              label="Company profiles"
              path="/profiles"
            />

            <NavItem
              icon={Package}
              label="Items"
              path="/items"
            />

            <NavItem
              icon={Repeat}
              label="Recurring"
              path="/recurring"
            />


            <div className="lg-sidebar-section-label lg-sidebar-section-gap">
              SYSTEM
            </div>


            <NavItem
              icon={SettingsIcon}
              label="Settings"
              path="/settings"
            />


            {/* SPACER */}

            <div
              style={{
                flex:
                  1,
              }}
            />


            {/* SERVER ERROR */}

            {saveError && (

              <div className="lg-sidebar-error">

                <span />

                Couldn't reach the server.
                Try again.

              </div>

            )}


            {/* LOGOUT */}

            <button
              className="lg-tab lg-sidebar-logout"
              onClick={logout}
            >

              <LogOut
                size={16}
              />

              <span>
                Log out
              </span>

            </button>

          </aside>

        )}


        {/* ==================================================
            CONTENT
            ================================================== */}

        <main
          className="lg-main-content"
          style={{
            flex:
              1,

            minWidth:
              0,

            minHeight:
              "100svh",

            overflow:
              "auto",

            background:
              "#F8FAFC",

            padding:
              "30px",
          }}
        >

          {loading ? (

            <div className="lg-loading">

              <div className="lg-loading-spinner" />

              Loading…

            </div>

          ) : (

            <Routes>

              <Route
                path="/"
                element={
                  <Dashboard
                    data={data}
                    clientsById={
                      clientsById
                    }
                  />
                }
              />

              <Route
                path="/invoices/*"
                element={
                  <Invoices
                    data={data}
                    clientsById={
                      clientsById
                    }
                    onDelete={
                      deleteInvoice
                    }
                    onSetStatus={
                      setStatus
                    }
                    onSaveInvoice={
                      saveInvoice
                    }
                  />
                }
              />

              <Route
                path="/purchase-invoices"
                element={
                  <PurchaseInvoices
                    clients={
                      data.clients
                    }
                    profiles={
                      data.profiles
                    }
                    purchaseInvoices={
                      data.purchaseInvoices
                    }
                    symbol={
                      data.settings.currencySymbol
                    }
                    onSave={
                      savePurchaseInvoice
                    }
                    onDelete={
                      deletePurchaseInvoice
                    }
                  />
                }
              />

              <Route
                path="/commission-entries"
                element={
                  <CommissionEntries
                    clients={data.clients}
                    items={data.items}
                    commissions={data.commissions}
                    symbol={data.settings.currencySymbol}
                    onSave={saveCommission}
                    onDelete={deleteCommission}
                  />
                }
              />

              <Route
                path="/reports"
                element={
                  <Reports
                    data={data}
                    clientsById={
                      clientsById
                    }
                    profiles={
                      data.profiles
                    }
                  />
                }
              />

              <Route
                path="/clients"
                element={
                  <Clients
                    clients={
                      data.clients
                    }
                    invoices={
                      data.invoices
                    }
                    onSave={
                      saveClient
                    }
                    onDelete={
                      deleteClient
                    }
                  />
                }
              />

              <Route
                path="/profiles"
                element={
                  <CompanyProfiles
                    profiles={
                      data.profiles
                    }
                    onSave={
                      saveCompanyProfile
                    }
                    onDelete={
                      deleteCompanyProfile
                    }
                  />
                }
              />

              <Route
                path="/items"
                element={
                  <Items
                    items={
                      data.items
                    }
                    settings={
                      data.settings
                    }
                    onSave={
                      saveItem
                    }
                    onDelete={
                      deleteItem
                    }
                  />
                }
              />

              <Route
                path="/recurring"
                element={
                  <Recurring
                    data={data}
                    clientsById={
                      clientsById
                    }
                    onSave={
                      saveRecurring
                    }
                    onDelete={
                      deleteRecurring
                    }
                    onGenerate={
                      generateFromRecurring
                    }
                  />
                }
              />

              <Route
                path="/settings"
                element={
                  <Settings
                    settings={
                      data.settings
                    }
                    onSave={
                      saveSettings
                    }
                  />
                }
              />

              <Route
                path="*"
                element={
                  <Dashboard
                    data={data}
                    clientsById={
                      clientsById
                    }
                  />
                }
              />

            </Routes>

          )}

        </main>

      </div>

    </div>

  );
}