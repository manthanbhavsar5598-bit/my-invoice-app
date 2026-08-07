export const STORAGE_KEY = "invoicing_data";

export const DEFAULT_DATA = {
  business: {
    name: "Your Business",
    email: "",
    phone: "",
    address: "",
    gstNumber: "",
    currencySymbol: "₹",
    taxRate: 0,
    prefix: "INV",
    nextNumber: 1001,
    bankName: "",
    branchName: "",
    accountNo: "",
    ifscCode: "",
    terms: "1. All payment should be made by cash/NEFT.\n2. Delivery immediate after receipt of payment.\n3. Interest @18% p.a. will be charged on overdue amounts.\n4. Goods once sold cannot be returned without prior approval.\n5. Subject to local jurisdiction.",
  },
  businessProfiles: [],
  clients: [],
  items: [],
  invoices: [],
  recurring: [],
};

export const BILL_TYPES = ["Invoice", "Tax Invoice", "Commission Invoice", "Quotation", "Proforma Invoice", "Credit Note", "Receipt"];

export function resolveProfile(business, profiles, id) {
  if (!id) return business;
  const p = (profiles || []).find((x) => x.id === id);
  return p ? { ...business, ...p } : business;
}

export function invoiceNumberForProfile(data, companyProfileId) {
  const p = resolveProfile(data.business, data.businessProfiles, companyProfileId);
  return `${p.prefix}-${p.nextNumber}`;
}

export function uid(p = "id") {
  return p + "_" + Math.random().toString(36).slice(2, 9);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function addInterval(iso, freq) {
  const d = new Date(iso);
  if (freq === "weekly") d.setDate(d.getDate() + 7);
  else if (freq === "monthly") d.setMonth(d.getMonth() + 1);
  else if (freq === "quarterly") d.setMonth(d.getMonth() + 3);
  else if (freq === "yearly") d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function isCommissionInvoice(inv) {
  return inv.billType === "Commission Invoice";
}

export function invoiceTitleLabel(billType) {
  if (!billType || billType === "Invoice") return "Tax Invoice";
  return billType;
}

export function lineAmount(li, inv) {
  if (isCommissionInvoice(inv)) return (Number(li.weight) || 0) * (Number(li.commission) || 0);
  return (Number(li.qty) || 0) * (Number(li.price) || 0);
}

export function computeTotals(invoice) {
    // Safe guard: ensure invoice exists and lineItems is an array
    const lineItems = invoice && Array.isArray(invoice.lineItems) ? invoice.lineItems : [];

    const subtotal = lineItems.reduce((acc, li) => acc + lineAmount(li, invoice), 0);

    const taxRate = Number(invoice?.taxRate) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, tax: taxAmount, total };
  }

export function displayStatus(inv) {
  if (inv.status === "paid" || inv.status === "draft") return inv.status;
  if (inv.dueDate && inv.dueDate < todayISO()) return "overdue";
  return inv.status;
}

export function money(amount, symbol) {
  const n = Number(amount) || 0;
  return symbol + n.toFixed(2);
}

export function numberToWords(num) {
  num = Math.round(num);
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function twoDigits(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  }
  function threeDigits(n) {
    if (n >= 100) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + twoDigits(n % 100) : "");
    return twoDigits(n);
  }
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const hundred = num;
  const parts = [];
  if (crore) parts.push(threeDigits(crore) + " Crore");
  if (lakh) parts.push(threeDigits(lakh) + " Lakh");
  if (thousand) parts.push(threeDigits(thousand) + " Thousand");
  if (hundred) parts.push(threeDigits(hundred));
  return parts.join(" ") || "Zero";
}

export function amountInWords(total, symbolName) {
  return `${numberToWords(total)} ${symbolName} Only`;
}

export function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}