export const STORAGE_KEY =
  "invoicing_data";

export const DEFAULT_DATA = {
  // App-level settings only.
  settings: {
    sendEmailOnInvoiceCreate: true,
    currencySymbol: "₹",
  },

  profiles: [],
  clients: [],
  items: [],
  invoices: [],
  recurring: [],
};

export const BILL_TYPES = [
  "Tax Invoice",
  "Commission Invoice",
];

// =========================================================
// COMPANY PROFILE RESOLVER
// =========================================================
export function resolveProfile(
  profiles,
  id
) {
  return (
    profiles || []
  ).find(
    (profile) =>
      String(profile.id) ===
      String(id)
  ) || {};
}

// =========================================================
// ID
// =========================================================
export function uid(
  prefix = "id"
) {
  return (
    prefix +
    "_" +
    Math.random()
      .toString(36)
      .slice(2, 9)
  );
}

// =========================================================
// TODAY
// =========================================================
export function todayISO() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

// =========================================================
// ADD DAYS
// =========================================================
export function addDays(
  iso,
  days
) {
  const date =
    new Date(iso);

  date.setDate(
    date.getDate() +
      days
  );

  return date
    .toISOString()
    .slice(0, 10);
}

// =========================================================
// ADD INTERVAL
// =========================================================
export function addInterval(
  iso,
  frequency
) {
  const date =
    new Date(iso);

  if (
    frequency ===
    "weekly"
  ) {
    date.setDate(
      date.getDate() + 7
    );
  } else if (
    frequency ===
    "monthly"
  ) {
    date.setMonth(
      date.getMonth() + 1
    );
  } else if (
    frequency ===
    "quarterly"
  ) {
    date.setMonth(
      date.getMonth() + 3
    );
  } else if (
    frequency ===
    "yearly"
  ) {
    date.setFullYear(
      date.getFullYear() + 1
    );
  }

  return date
    .toISOString()
    .slice(0, 10);
}

// =========================================================
// FORMAT DATE
// =========================================================
export function fmtDate(
  iso
) {
  if (!iso) return "—";

  const date =
    new Date(
      iso + "T00:00:00"
    );

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

// =========================================================
// COMMISSION INVOICE
// =========================================================
export function isCommissionInvoice(
  invoice
) {
  return (
    invoice?.billType ===
    "Commission Invoice"
  );
}

// =========================================================
// INVOICE TITLE
// =========================================================
export function invoiceTitleLabel(
  billType
) {
  if (
    !billType ||
    billType === "Invoice"
  ) {
    return "Tax Invoice";
  }

  return billType;
}

// =========================================================
// LINE AMOUNT
// =========================================================
export function lineAmount(
  lineItem,
  invoice
) {
  if (
    isCommissionInvoice(
      invoice
    )
  ) {
    return (
      (Number(
        lineItem?.weight
      ) || 0) *
      (Number(
        lineItem?.commission
      ) || 0)
    );
  }

  return (
    (Number(
      lineItem?.qty
    ) || 0) *
    (Number(
      lineItem?.price
    ) || 0)
  );
}

// =========================================================
// COMPUTE TOTALS
// =========================================================
// Supports:
//
// Frontend:
// invoice.lineItems
//
// Backend:
// invoice.items
//
// Also preserves backend calculated:
//
// subtotal
// taxAmount
// total
//
// This is important for Reports.
// =========================================================
export function computeTotals(
  invoice
) {
  if (!invoice) {
    return {
      subtotal: 0,
      taxAmount: 0,
      tax: 0,
      total: 0,
    };
  }

  // -------------------------------------------------------
  // SUPPORT BOTH DATA SHAPES
  // -------------------------------------------------------
  const lineItems =
    Array.isArray(
      invoice.lineItems
    )
      ? invoice.lineItems
      : Array.isArray(
          invoice.items
        )
      ? invoice.items
      : [];

  // -------------------------------------------------------
  // CALCULATE SUBTOTAL
  // -------------------------------------------------------
  const calculatedSubtotal =
    lineItems.reduce(
      (total, item) =>
        total +
        lineAmount(
          item,
          invoice
        ),
      0
    );

  // -------------------------------------------------------
  // TAX RATE
  // -------------------------------------------------------
  const taxRate =
    Number(
      invoice.taxRate
    ) || 0;

  // -------------------------------------------------------
  // CALCULATE TAX
  // -------------------------------------------------------
  const calculatedTaxAmount =
    calculatedSubtotal *
    (taxRate / 100);

  // -------------------------------------------------------
  // CALCULATE TOTAL
  // -------------------------------------------------------
  const calculatedTotal =
    calculatedSubtotal +
    calculatedTaxAmount;

  // -------------------------------------------------------
  // BACKEND VALUES
  // -------------------------------------------------------
  //
  // Backend Invoice model saves:
  //
  // subtotal
  // taxAmount
  // total
  //
  // Prefer those values when available.
  // -------------------------------------------------------
  const storedSubtotal =
    Number(
      invoice.subtotal
    );

  const storedTaxAmount =
    Number(
      invoice.taxAmount
    );

  const storedTotal =
    Number(
      invoice.total
    );

  // -------------------------------------------------------
  // FINAL SUBTOTAL
  // -------------------------------------------------------
  const finalSubtotal =
    Number.isFinite(
      storedSubtotal
    ) &&
    storedSubtotal > 0
      ? storedSubtotal
      : calculatedSubtotal;

  // -------------------------------------------------------
  // FINAL TAX
  // -------------------------------------------------------
  const finalTaxAmount =
    Number.isFinite(
      storedTaxAmount
    ) &&
    storedTaxAmount > 0
      ? storedTaxAmount
      : calculatedTaxAmount;

  // -------------------------------------------------------
  // FINAL TOTAL
  // -------------------------------------------------------
  const finalTotal =
    Number.isFinite(
      storedTotal
    ) &&
    storedTotal > 0
      ? storedTotal
      : calculatedTotal;

  return {
    subtotal: Number(
      finalSubtotal.toFixed(2)
    ),

    taxAmount: Number(
      finalTaxAmount.toFixed(2)
    ),

    tax: Number(
      finalTaxAmount.toFixed(2)
    ),

    total: Number(
      finalTotal.toFixed(2)
    ),
  };
}

// =========================================================
// DISPLAY STATUS
// =========================================================
export function displayStatus(
  invoice
) {
  if (
    invoice?.status ===
      "paid" ||
    invoice?.status ===
      "draft"
  ) {
    return invoice.status;
  }

  if (
    invoice?.dueDate &&
    invoice.dueDate <
      todayISO()
  ) {
    return "overdue";
  }

  return (
    invoice?.status ||
    "draft"
  );
}

// =========================================================
// MONEY
// =========================================================
export function money(
  amount,
  symbol
) {
  const number =
    Number(amount) || 0;

  return (
    symbol +
    number.toFixed(2)
  );
}

// =========================================================
// NUMBER TO WORDS
// =========================================================
export function numberToWords(
  num
) {
  num = Math.round(num);

  if (num === 0) {
    return "Zero";
  }

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function twoDigits(
    number
  ) {
    if (
      number < 20
    ) {
      return ones[number];
    }

    return (
      tens[
        Math.floor(
          number / 10
        )
      ] +
      (
        number % 10
          ? " " +
            ones[
              number % 10
            ]
          : ""
      )
    );
  }

  function threeDigits(
    number
  ) {
    if (
      number >= 100
    ) {
      return (
        ones[
          Math.floor(
            number / 100
          )
        ] +
        " Hundred" +
        (
          number % 100
            ? " " +
              twoDigits(
                number % 100
              )
            : ""
        )
      );
    }

    return twoDigits(
      number
    );
  }

  let crore =
    Math.floor(
      num / 10000000
    );

  num %= 10000000;

  let lakh =
    Math.floor(
      num / 100000
    );

  num %= 100000;

  let thousand =
    Math.floor(
      num / 1000
    );

  num %= 1000;

  const hundred =
    num;

  const parts = [];

  if (crore) {
    parts.push(
      threeDigits(
        crore
      ) +
        " Crore"
    );
  }

  if (lakh) {
    parts.push(
      threeDigits(
        lakh
      ) +
        " Lakh"
    );
  }

  if (thousand) {
    parts.push(
      threeDigits(
        thousand
      ) +
        " Thousand"
    );
  }

  if (hundred) {
    parts.push(
      threeDigits(
        hundred
      )
    );
  }

  return (
    parts.join(" ") ||
    "Zero"
  );
}

// =========================================================
// AMOUNT IN WORDS
// =========================================================
export function amountInWords(
  total,
  symbolName
) {
  return `${numberToWords(
    total
  )} ${symbolName} Only`;
}

// =========================================================
// ESCAPE HTML
// =========================================================
export function escapeHtml(
  value
) {
  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    );
}