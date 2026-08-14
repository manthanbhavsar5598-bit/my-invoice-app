import {
  uid,
  computeTotals,
} from "./helpers";

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";

// =========================================================
// AUTH TOKEN (Bearer header)
// =========================================================
// The backend also sets an httpOnly cookie, but modern browsers
// increasingly block third-party cookies between two different sites
// (e.g. two separate *.vercel.app deployments), which silently breaks
// cookie-only auth. Storing the JWT from the login/signup response and
// sending it as an Authorization header sidesteps that entirely — the
// backend's auth middleware already accepts either. Persisting to
// localStorage keeps the session alive across page refreshes/new tabs.
const TOKEN_KEY = "authToken";

let authToken = null;
try {
  authToken = localStorage.getItem(TOKEN_KEY);
} catch (error) {
  // localStorage unavailable (e.g. private browsing) — fall back to
  // cookie-only auth for this session.
}

export function setAuthToken(token) {
  authToken = token || null;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (error) {
    // Ignore storage errors — the in-memory token still works for this tab.
  }
}

export function getAuthToken() {
  return authToken;
}

// =========================================================
// REQUEST HELPER
// =========================================================
async function request(
  path,
  options = {}
) {
  const res = await fetch(
    `${API_BASE}${path}`,
    {
      credentials: "include",

      headers: {
        "Content-Type":
          "application/json",
        ...(authToken
          ? { Authorization: `Bearer ${authToken}` }
          : {}),
      },

      ...options,
    }
  );

  let json = null;

  try {
    json = await res.json();
  } catch (error) {
    // No JSON response
  }

  if (!res.ok) {
    const msg =
      json?.message ||
      json?.errors?.[0]
        ?.message ||
      `Request failed (${res.status})`;

    throw new Error(msg);
  }

  return json;
}

// =========================================================
// HTTP HELPERS
// =========================================================
const get = (path) =>
  request(path);

const post = (
  path,
  body
) =>
  request(path, {
    method: "POST",
    body: JSON.stringify(body),
  });

const patch = (
  path,
  body
) =>
  request(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

const del = (path) =>
  request(path, {
    method: "DELETE",
  });

// =========================================================
// DATE HELPER
// =========================================================
const iso = (date) =>
  date
    ? new Date(date)
        .toISOString()
        .slice(0, 10)
    : "";

// =========================================================
// MAPPERS
// MongoDB -> Frontend
// =========================================================

const mapClient = (client) => ({
  id: client._id,
  name: client.name || "",
  email: client.email || "",
  phone: client.phone || "",
  address:
    client.address || "",
  gstNumber:
    client.gstNumber || "",
  stateCode:
    client.stateCode || "",
  notes: client.notes || "",
});

const mapItem = (item) => ({
  id: item._id,
  name: item.name || "",
  description:
    item.description || "",
  hsnCode:
    item.hsnCode || "",
  unit: item.unit || "",
  price:
    item.price || 0,
});

// =========================================================
// COMPANY PROFILE
// =========================================================
const mapProfile = (
  profile
) => ({
  id: profile._id,
  name: profile.name || "",
  email: profile.email || "",
  phone: profile.phone || "",
  address:
    profile.address || "",
  gstNumber:
    profile.gstNumber || "",
  panNumber:
    profile.panNumber || "",
  currencySymbol:
    profile.currencySymbol ||
    "₹",
  bankName:
    profile.bankName || "",
  branchName:
    profile.branchName || "",
  accountNo:
    profile.accountNo || "",
  ifscCode:
    profile.ifscCode || "",
  terms: profile.terms || "",
});

// =========================================================
// USER SETTINGS
// =========================================================
const mapSettings = (
  user
) => ({
  name: user?.name || "",
  email: user?.email || "",

  sendEmailOnInvoiceCreate:
    user?.settings
      ?.sendEmailOnInvoiceCreate !==
    false,

  currencySymbol:
    user?.settings
      ?.currencySymbol || "₹",
});

// =========================================================
// LINE ITEM
// =========================================================
const mapLine = (
  lineItem
) => ({
  ...lineItem,
  id:
    lineItem.id ||
    uid("li"),
});

// =========================================================
// INVOICE
// =========================================================
// IMPORTANT FIXES:
//
// 1. companyProfile can be an ObjectId OR populated object.
// 2. subtotal is preserved.
// 3. taxAmount is preserved.
// 4. total is preserved.
//
// Without these values Reports receives 0.
// =========================================================
const mapInvoice = (
  invoice
) => ({
  id: invoice._id,

  number:
    invoice.number || "",

  billType:
    invoice.billType ||
    "Invoice",

  billTitle:
    invoice.billTitle || "",

  // -----------------------------------------------
  // COMPANY PROFILE ID
  // -----------------------------------------------
  companyProfileId:
    typeof invoice.companyProfile ===
    "object"
      ? invoice.companyProfile?._id ||
        invoice.companyProfile?.id ||
        ""
      : invoice.companyProfile ||
        "",

  stateType:
    invoice.stateType || "",

  // -----------------------------------------------
  // CUSTOMER
  // -----------------------------------------------
  clientId:
    (
      typeof invoice.client ===
      "object"
        ? invoice.client?._id
        : invoice.client
    ) || "",

  // -----------------------------------------------
  // DATES
  // -----------------------------------------------
  issueDate: iso(
    invoice.issueDate
  ),

  dueDate: iso(
    invoice.dueDate
  ),

  // -----------------------------------------------
  // ITEMS
  // -----------------------------------------------
  lineItems:
    (
      invoice.items || []
    ).map(mapLine),

  // -----------------------------------------------
  // TAX RATE
  // -----------------------------------------------
  taxRate:
    Number(
      invoice.taxRate
    ) || 0,

  // -----------------------------------------------
  // IMPORTANT:
  // BACKEND CALCULATED VALUES
  // -----------------------------------------------
  subtotal:
    Number(
      invoice.subtotal
    ) || 0,

  taxAmount:
    Number(
      invoice.taxAmount
    ) || 0,

  total:
    Number(
      invoice.total
    ) || 0,

  // -----------------------------------------------
  // OTHER FIELDS
  // -----------------------------------------------
  notes:
    invoice.notes || "",

  transportName:
    invoice.transportName ||
    "",

  vehicleNo:
    invoice.vehicleNo || "",

  shipDispatchType:
    invoice.shipDispatchType ||
    "",

  shipDispatchName:
    invoice.shipDispatchName ||
    "",

  shipDispatchAddress:
    invoice.shipDispatchAddress ||
    "",

  shipDispatchGst:
    invoice.shipDispatchGst ||
    "",

  status:
    invoice.status ||
    "draft",

  paidDate:
    invoice.paidDate
      ? iso(
          invoice.paidDate
        )
      : null,
});

// =========================================================
// PURCHASE INVOICE
// =========================================================
const mapPurchaseInvoice = (pi) => ({
  id: pi._id,
  date: iso(pi.date),
  billNo: pi.billNo || "",
  companyProfileId:
    typeof pi.companyProfile === "object"
      ? pi.companyProfile?._id || pi.companyProfile?.id || ""
      : pi.companyProfile || "",
  companyProfileName:
    typeof pi.companyProfile === "object" ? pi.companyProfile?.name || "" : "",
  billFrom:
    (typeof pi.billFrom === "object" ? pi.billFrom?._id : pi.billFrom) || "",
  billFromName:
    typeof pi.billFrom === "object" ? pi.billFrom?.name || "" : "",
  hsnCode: pi.hsnCode || "",
  weight: Number(pi.weight) || 0,
  amount: Number(pi.amount) || 0,
  igst: Number(pi.igst) || 0,
  cgst: Number(pi.cgst) || 0,
  sgst: Number(pi.sgst) || 0,
  roundOff: Number(pi.roundOff) || 0,
  grandTotal: Number(pi.grandTotal) || 0,
});

const purchaseInvoiceToApi = (pi) => ({
  date: pi.date,
  billNo: pi.billNo,
  companyProfile: pi.companyProfileId || undefined,
  billFrom: pi.billFrom,
  hsnCode: pi.hsnCode,
  weight: Number(pi.weight) || 0,
  amount: Number(pi.amount) || 0,
  igst: Number(pi.igst) || 0,
  cgst: Number(pi.cgst) || 0,
  sgst: Number(pi.sgst) || 0,
  roundOff: Number(pi.roundOff) || 0,
});

const mapCommission = (c) => ({
  id: c._id,
  date: iso(c.date),
  fromCompany:
    (typeof c.fromCompany === "object" ? c.fromCompany?._id : c.fromCompany) || "",
  fromCompanyName:
    typeof c.fromCompany === "object" ? c.fromCompany?.name || "" : "",
  toCompany:
    (typeof c.toCompany === "object" ? c.toCompany?._id : c.toCompany) || "",
  toCompanyName:
    typeof c.toCompany === "object" ? c.toCompany?.name || "" : "",
  item: (typeof c.item === "object" ? c.item?._id : c.item) || "",
  itemName: typeof c.item === "object" ? c.item?.name || "" : "",
  quantity: Number(c.quantity) || 0,
  rate: Number(c.rate) || 0,
  amount: Number(c.amount) || 0,
});

const commissionToApi = (c) => ({
  date: c.date,
  fromCompany: c.fromCompany,
  toCompany: c.toCompany,
  item: c.item,
  quantity: Number(c.quantity) || 0,
  rate: Number(c.rate) || 0,
});

// =========================================================
// RECURRING
// =========================================================
const mapRecurring = (
  recurring
) => ({
  id: recurring._id,

  clientId:
    (
      typeof recurring.client ===
      "object"
        ? recurring.client?._id
        : recurring.client
    ) || "",

  frequency:
    recurring.frequency ||
    "monthly",

  nextDate: iso(
    recurring.nextDate
  ),

  lastGenerated:
    recurring.lastGenerated
      ? iso(
          recurring.lastGenerated
        )
      : null,

  active:
    recurring.active !== false,

  taxRate:
    recurring.taxRate || 0,

  notes:
    recurring.notes || "",

  lineItems:
    (
      recurring.lineItems ||
      []
    ).map(mapLine),
});

// =========================================================
// INVOICE -> API
// =========================================================
// Frontend -> Backend
// =========================================================
const invoiceToApi = (
  invoice
) => {
  const totals =
    computeTotals(invoice);

  return {
    client:
      invoice.clientId,

    companyProfile:
      invoice.companyProfileId ||
      undefined,

    number:
      invoice.number,

    billType:
      invoice.billType,

    billTitle:
      invoice.billTitle,

    stateType:
      invoice.stateType,

    items:
      invoice.lineItems,

    taxRate:
      Number(
        invoice.taxRate
      ) || 0,

    notes:
      invoice.notes,

    transportName:
      invoice.transportName,

    vehicleNo:
      invoice.vehicleNo,

    shipDispatchType:
      invoice.shipDispatchType,

    shipDispatchName:
      invoice.shipDispatchName,

    shipDispatchAddress:
      invoice.shipDispatchAddress,

    shipDispatchGst:
      invoice.shipDispatchGst,

    status:
      invoice.status,

    issueDate:
      invoice.issueDate,

    dueDate:
      invoice.dueDate,

    // -----------------------------------------------
    // TOTALS
    // -----------------------------------------------
    subtotal:
      totals.subtotal,

    taxAmount:
      totals.taxAmount,

    total:
      totals.total,
  };
};

// =========================================================
// RECURRING -> API
// =========================================================
const recurringToApi = (
  recurring
) => ({
  client:
    recurring.clientId,

  frequency:
    recurring.frequency,

  nextDate:
    recurring.nextDate,

  active:
    recurring.active,

  taxRate:
    Number(
      recurring.taxRate
    ) || 0,

  notes:
    recurring.notes,

  lineItems:
    recurring.lineItems,
});

// =========================================================
// API
// =========================================================
export const api = {
  // =======================================================
  // AUTH
  // =======================================================
  auth: {
    me: async () =>
      mapSettings(
        (
          await get(
            "/auth/me"
          )
        ).data.user
      ),

    login: async (
      email,
      password
    ) => {
      const result = await post(
        "/auth/login",
        {
          email,
          password,
        }
      );
      if (result?.token) {
        setAuthToken(result.token);
      }
      return result;
    },

    signup: async (
      name,
      email,
      password
    ) => {
      const result = await post(
        "/auth/signup",
        {
          name,
          email,
          password,
        }
      );
      if (result?.token) {
        setAuthToken(result.token);
      }
      return result;
    },

    logout: async () => {
      try {
        return await post(
          "/auth/logout",
          {}
        );
      } finally {
        setAuthToken(null);
      }
    },

    updatePassword: (
      currentPassword,
      newPassword
    ) =>
      patch(
        "/auth/update-password",
        {
          currentPassword,
          newPassword,
        }
      ),

    updateSettings:
      async (
        settings
      ) =>
        mapSettings(
          (
            await patch(
              "/auth/update-me",
              {
                settings,
              }
            )
          ).data.user
        ),

    requestPasswordReset:
      (email) =>
        post(
          "/auth/forgot-password",
          {
            email,
          }
        ),

    resetPasswordWithPin:
      (
        email,
        pin,
        newPassword
      ) =>
        post(
          "/auth/reset-password",
          {
            email,
            pin,
            newPassword,
          }
        ),
  },

  // =======================================================
  // CLIENTS
  // =======================================================
  clients: {
    list: async () =>
      (
        await get(
          "/clients?limit=100"
        )
      ).data.clients.map(
        mapClient
      ),

    create: async (
      client
    ) =>
      mapClient(
        (
          await post(
            "/clients",
            client
          )
        ).data.client
      ),

    update: async (
      id,
      client
    ) =>
      mapClient(
        (
          await patch(
            `/clients/${id}`,
            client
          )
        ).data.client
      ),

    remove: (id) =>
      del(
        `/clients/${id}`
      ),
  },

  // =======================================================
  // ITEMS
  // =======================================================
  items: {
    list: async () =>
      (
        await get(
          "/items"
        )
      ).data.items.map(
        mapItem
      ),

    create: async (
      item
    ) =>
      mapItem(
        (
          await post(
            "/items",
            item
          )
        ).data.item
      ),

    update: async (
      id,
      item
    ) =>
      mapItem(
        (
          await patch(
            `/items/${id}`,
            item
          )
        ).data.item
      ),

    remove: (id) =>
      del(
        `/items/${id}`
      ),
  },

  // =======================================================
  // COMPANY PROFILES
  // =======================================================
  profiles: {
    list: async () =>
      (
        await get(
          "/company-profiles"
        )
      ).data.profiles.map(
        mapProfile
      ),

    create: async (
      profile
    ) =>
      mapProfile(
        (
          await post(
            "/company-profiles",
            profile
          )
        ).data.profile
      ),

    update: async (
      id,
      profile
    ) =>
      mapProfile(
        (
          await patch(
            `/company-profiles/${id}`,
            profile
          )
        ).data.profile
      ),

    remove: (id) =>
      del(
        `/company-profiles/${id}`
      ),
  },

  // =======================================================
  // INVOICES
  // =======================================================
  invoices: {
    list: async () =>
      (
        await get(
          "/invoices?limit=100"
        )
      ).data.invoices.map(
        mapInvoice
      ),

    create: async (
      invoice
    ) =>
      mapInvoice(
        (
          await post(
            "/invoices",
            invoiceToApi(
              invoice
            )
          )
        ).data.invoice
      ),

    update: async (
      id,
      invoice
    ) =>
      mapInvoice(
        (
          await patch(
            `/invoices/${id}`,
            invoiceToApi(
              invoice
            )
          )
        ).data.invoice
      ),

    remove: (id) =>
      del(
        `/invoices/${id}`
      ),
  },

  // =======================================================
  // PURCHASE INVOICES
  // =======================================================
  purchaseInvoices: {
    list: async () =>
      (await get("/purchase-invoices")).data.purchaseInvoices.map(
        mapPurchaseInvoice
      ),

    create: async (pi) =>
      mapPurchaseInvoice(
        (await post("/purchase-invoices", purchaseInvoiceToApi(pi))).data
          .purchaseInvoice
      ),

    update: async (id, pi) =>
      mapPurchaseInvoice(
        (await patch(`/purchase-invoices/${id}`, purchaseInvoiceToApi(pi)))
          .data.purchaseInvoice
      ),

    remove: (id) => del(`/purchase-invoices/${id}`),
  },

  commissions: {
    list: async () =>
      (await get("/commissions")).data.commissions.map(mapCommission),

    create: async (c) =>
      mapCommission(
        (await post("/commissions", commissionToApi(c))).data.commission
      ),

    update: async (id, c) =>
      mapCommission(
        (await patch(`/commissions/${id}`, commissionToApi(c))).data
          .commission
      ),

    remove: (id) => del(`/commissions/${id}`),
  },

  // =======================================================
  // RECURRING
  // =======================================================
  recurring: {
    list: async () =>
      (
        await get(
          "/recurring"
        )
      ).data.recurring.map(
        mapRecurring
      ),

    create: async (
      recurring
    ) =>
      mapRecurring(
        (
          await post(
            "/recurring",
            recurringToApi(
              recurring
            )
          )
        ).data.recurring
      ),

    update: async (
      id,
      recurring
    ) =>
      mapRecurring(
        (
          await patch(
            `/recurring/${id}`,
            recurringToApi(
              recurring
            )
          )
        ).data.recurring
      ),

    remove: (id) =>
      del(
        `/recurring/${id}`
      ),

    generate: async (
      id
    ) => {
      const response =
        await post(
          `/recurring/${id}/generate`,
          {}
        );

      return {
        invoice:
          mapInvoice(
            response.data.invoice
          ),

        recurring:
          mapRecurring(
            response.data.recurring
          ),
      };
    },
  },
};