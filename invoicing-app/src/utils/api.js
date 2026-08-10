import { uid, computeTotals } from "./helpers";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let json = null;
  try { json = await res.json(); } catch (e) {}
  if (!res.ok) {
    const msg = json?.message || json?.errors?.[0]?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json;
}

const get = (p) => request(p);
const post = (p, body) => request(p, { method: "POST", body: JSON.stringify(body) });
const patch = (p, body) => request(p, { method: "PATCH", body: JSON.stringify(body) });
const del = (p) => request(p, { method: "DELETE" });

const iso = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

// ---- mappers: Mongo docs -> the flat shape the existing components expect ----
const mapClient = (c) => ({ id: c._id, name: c.name || "", email: c.email || "", phone: c.phone || "", address: c.address || "", gstNumber: c.gstNumber || "", stateCode: c.stateCode || "", notes: c.notes || "" });
const mapItem = (i) => ({ id: i._id, name: i.name || "", description: i.description || "", hsnCode: i.hsnCode || "", unit: i.unit || "", price: i.price || 0 });
// Company Profile is fully independent from User — no isPrimary, no fallback.
const mapProfile = (p) => ({ id: p._id, name: p.name || "", email: p.email || "", phone: p.phone || "", address: p.address || "", gstNumber: p.gstNumber || "", currencySymbol: p.currencySymbol || "₹", bankName: p.bankName || "", branchName: p.branchName || "", accountNo: p.accountNo || "", ifscCode: p.ifscCode || "", terms: p.terms || "" });
// User only carries login/app-setting data — never company data.
const mapSettings = (u) => ({
  name: u?.name || "",
  email: u?.email || "",
  sendEmailOnInvoiceCreate: u?.settings?.sendEmailOnInvoiceCreate !== false,
  currencySymbol: u?.settings?.currencySymbol || "₹",
});
const mapLine = (li) => ({ ...li, id: li.id || uid("li") });
const mapInvoice = (i) => ({
  id: i._id,
  number: i.number || "",
  billType: i.billType || "Invoice",
  companyProfileId: i.companyProfile || "",
  stateType: i.stateType || "",
  clientId: (typeof i.client === "object" ? i.client?._id : i.client) || "",
  issueDate: iso(i.issueDate),
  dueDate: iso(i.dueDate),
  lineItems: (i.items || []).map(mapLine),
  taxRate: i.taxRate || 0,
  notes: i.notes || "",
  transportName: i.transportName || "",
  vehicleNo: i.vehicleNo || "",
  shipDispatchType: i.shipDispatchType || "",
  shipDispatchName: i.shipDispatchName || "",
  shipDispatchAddress: i.shipDispatchAddress || "",
  shipDispatchGst: i.shipDispatchGst || "",
  status: i.status || "draft",
  paidDate: i.paidDate ? iso(i.paidDate) : null,
});
const mapRecurring = (r) => ({
  id: r._id,
  clientId: (typeof r.client === "object" ? r.client?._id : r.client) || "",
  frequency: r.frequency || "monthly",
  nextDate: iso(r.nextDate),
  lastGenerated: r.lastGenerated ? iso(r.lastGenerated) : null,
  active: r.active !== false,
  taxRate: r.taxRate || 0,
  notes: r.notes || "",
  lineItems: (r.lineItems || []).map(mapLine),
});

// ---- payload builders: frontend shape -> what the API expects ----
// Totals are computed here (frontend) and sent as-is; the backend stores
// them without recalculating, so there's a single source of truth.
const invoiceToApi = (inv) => {
  const totals = computeTotals(inv);
  return {
    client: inv.clientId,
    companyProfile: inv.companyProfileId || undefined,
    number: inv.number,
    billType: inv.billType,
    stateType: inv.stateType,
    items: inv.lineItems,
    taxRate: Number(inv.taxRate) || 0,
    notes: inv.notes,
    transportName: inv.transportName,
    vehicleNo: inv.vehicleNo,
    shipDispatchType: inv.shipDispatchType,
    shipDispatchName: inv.shipDispatchName,
    shipDispatchAddress: inv.shipDispatchAddress,
    shipDispatchGst: inv.shipDispatchGst,
    status: inv.status,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    subtotal: totals.subtotal,
    taxAmount: totals.taxAmount,
    total: totals.total,
  };
};
const recurringToApi = (r) => ({
  client: r.clientId,
  frequency: r.frequency,
  nextDate: r.nextDate,
  active: r.active,
  taxRate: Number(r.taxRate) || 0,
  notes: r.notes,
  lineItems: r.lineItems,
});

export const api = {
  auth: {
    me: async () => mapSettings((await get("/auth/me")).data.user),
    login: (email, password) => post("/auth/login", { email, password }),
    signup: (name, email, password) => post("/auth/signup", { name, email, password }),
    logout: () => post("/auth/logout", {}),
    updatePassword: (currentPassword, newPassword) => patch("/auth/update-password", { currentPassword, newPassword }),
    updateSettings: async (settings) => mapSettings((await patch("/auth/update-me", { settings })).data.user),
    // PIN-based reset — no current password required. Restricted server-side
    // to a single configured account.
    requestPasswordReset: (email) => post("/auth/forgot-password", { email }),
    resetPasswordWithPin: (email, pin, newPassword) => post("/auth/reset-password", { email, pin, newPassword }),
  },
  clients: {
    list: async () => (await get("/clients?limit=100")).data.clients.map(mapClient),
    create: async (c) => mapClient((await post("/clients", c)).data.client),
    update: async (id, c) => mapClient((await patch(`/clients/${id}`, c)).data.client),
    remove: (id) => del(`/clients/${id}`),
  },
  items: {
    list: async () => (await get("/items")).data.items.map(mapItem),
    create: async (i) => mapItem((await post("/items", i)).data.item),
    update: async (id, i) => mapItem((await patch(`/items/${id}`, i)).data.item),
    remove: (id) => del(`/items/${id}`),
  },
  // Company Profiles — a user can have many, none of them "primary".
  profiles: {
    list: async () => (await get("/company-profiles")).data.profiles.map(mapProfile),
    create: async (p) => mapProfile((await post("/company-profiles", p)).data.profile),
    update: async (id, p) => mapProfile((await patch(`/company-profiles/${id}`, p)).data.profile),
    remove: (id) => del(`/company-profiles/${id}`),
  },
  invoices: {
    list: async () => (await get("/invoices?limit=100")).data.invoices.map(mapInvoice),
    create: async (inv) => mapInvoice((await post("/invoices", invoiceToApi(inv))).data.invoice),
    update: async (id, inv) => mapInvoice((await patch(`/invoices/${id}`, invoiceToApi(inv))).data.invoice),
    remove: (id) => del(`/invoices/${id}`),
  },
  recurring: {
    list: async () => (await get("/recurring")).data.recurring.map(mapRecurring),
    create: async (r) => mapRecurring((await post("/recurring", recurringToApi(r))).data.recurring),
    update: async (id, r) => mapRecurring((await patch(`/recurring/${id}`, recurringToApi(r))).data.recurring),
    remove: (id) => del(`/recurring/${id}`),
    generate: async (id) => {
      const res = await post(`/recurring/${id}/generate`, {});
      return { invoice: mapInvoice(res.data.invoice), recurring: mapRecurring(res.data.recurring) };
    },
  },
};