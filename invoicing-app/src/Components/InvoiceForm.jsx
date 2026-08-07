import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Trash2, Plus } from "lucide-react";
import ClientPicker from "./ClientPicker";
import { uid, todayISO, addDays, invoiceNumberForProfile, computeTotals, money, isCommissionInvoice, BILL_TYPES } from "../utils/helpers";

function blankLine() {
  return { id: uid("li"), description: "", hsnCode: "", qty: 1, unit: "", price: 0, date: todayISO(), partyName: "", weight: "", commission: "", amount: 0 };
}

function blankInvoice() {
  return {
    id: uid("inv"),
    number: "",
    billType: "Invoice",
    companyProfileId: "",
    stateType: "",
    clientId: "",
    issueDate: todayISO(),
    dueDate: addDays(todayISO(), 15),
    lineItems: [blankLine()],
    taxRate: 0,
    notes: "",
    transportName: "",
    vehicleNo: "",
    shipDispatchType: "",
    shipDispatchName: "",
    shipDispatchAddress: "",
    shipDispatchGst: "",
    status: "draft",
    paidDate: null,
  };
}

export default function InvoiceForm({ data, onSave }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const existing = !isNew ? data.invoices.find((i) => i.id === id) : null;
  const [inv, setInv] = useState(() => existing ? { ...blankInvoice(), ...existing } : blankInvoice());

  useEffect(() => {
    setInv(existing ? { ...blankInvoice(), ...existing } : blankInvoice());
  }, [id]);

  useEffect(() => {
    if (isNew) {
      setInv((cur) => ({ ...cur, number: invoiceNumberForProfile(data, cur.companyProfileId) }));
    }
  }, [inv.companyProfileId, isNew, data]);

  const totals = computeTotals(inv);
  const symbol = data.business.currencySymbol;

  function updateLine(lineId, patch) {
    setInv({ ...inv, lineItems: inv.lineItems.map((li) => (li.id === lineId ? { ...li, ...patch } : li)) });
  }

  function addLine() {
    setInv({ ...inv, lineItems: [...inv.lineItems, blankLine()] });
  }

  function removeLine(lineId) {
    setInv({ ...inv, lineItems: inv.lineItems.filter((li) => li.id !== lineId) });
  }

  function pickCatalogItem(lineId, itemId) {
    const item = data.items.find((i) => i.id === itemId);
    if (!item) return;
    updateLine(lineId, { description: item.name, price: item.price, hsnCode: item.hsnCode || "", unit: item.unit || "" });
  }

  function handleSave() {
    if (!inv.clientId) { alert("Pick a client first."); return; }
    onSave(inv, isNew);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <button className="lg-btn-ghost" onClick={() => navigate("/invoices")}><ChevronLeft size={14} /> Back</button>
        <h1 className="lg-display" style={{ fontSize: 24, margin: 0 }}>{isNew ? "New invoice" : `Edit ${inv.number}`}</h1>
      </div>

      <div className="lg-card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: "var(--ink-soft)" }}>Select customer & bill type</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Bill type</label>
          <select value={inv.billType} onChange={(e) => {
            const newType = e.target.value;
            const wasCommission = isCommissionInvoice(inv);
            const willBeCommission = newType === "Commission Invoice";
            if (wasCommission !== willBeCommission) {
              setInv({ ...inv, billType: newType, lineItems: [blankLine()] });
            } else {
              setInv({ ...inv, billType: newType });
            }
          }}>
            {BILL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Company profile</label>
          <select value={inv.companyProfileId} onChange={(e) => setInv({ ...inv, companyProfileId: e.target.value })}>
            <option value="">{data.business.name} (primary)</option>
            {data.businessProfiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Customer</label>
          <ClientPicker clients={data.clients} value={inv.clientId} onChange={(clientId) => setInv({ ...inv, clientId })} />
        </div>
      </div>

      <div className="lg-card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: "var(--ink-soft)" }}>Header</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Invoice no <span style={{ color: "var(--stamp-red)" }}>*</span></label>
            <input className="lg-mono" value={inv.number} onChange={(e) => setInv({ ...inv, number: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Date <span style={{ color: "var(--stamp-red)" }}>*</span></label>
            <input type="date" value={inv.issueDate} onChange={(e) => setInv({ ...inv, issueDate: e.target.value, dueDate: addDays(e.target.value, 15) })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>State type <span style={{ color: "var(--stamp-red)" }}>*</span></label>
            <select value={inv.stateType} onChange={(e) => {
              const st = e.target.value;
              const rate = st === "na" ? 0 : st === "intra" || st === "inter" ? 18 : inv.taxRate;
              setInv({ ...inv, stateType: st, taxRate: rate });
            }}>
              <option value="">Select…</option>
              <option value="intra">Intra-state (SGST 9% + CGST 9%)</option>
              <option value="inter">Inter-state (IGST 18%)</option>
              <option value="na">N/A</option>
            </select>
          </div>
        </div>
      </div>

      {!isCommissionInvoice(inv) && (
        <div className="lg-card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: "var(--ink-soft)" }}>Ship to / Dispatch from <span style={{ fontWeight: 400 }}>— optional</span></div>
          <div style={{ marginBottom: inv.shipDispatchType ? 12 : 0 }}>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Add address</label>
            <select value={inv.shipDispatchType} onChange={(e) => setInv({ ...inv, shipDispatchType: e.target.value })}>
              <option value="">None</option>
              <option value="shipTo">Ship to</option>
              <option value="dispatchFrom">Dispatch from</option>
            </select>
          </div>
          {inv.shipDispatchType && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>{inv.shipDispatchType === "shipTo" ? "Ship to name" : "Dispatch from name"}</label>
                <input value={inv.shipDispatchName} onChange={(e) => setInv({ ...inv, shipDispatchName: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>GST no</label>
                <input value={inv.shipDispatchGst} onChange={(e) => setInv({ ...inv, shipDispatchGst: e.target.value })} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>{inv.shipDispatchType === "shipTo" ? "Ship to address" : "Dispatch from address"}</label>
                <textarea rows={2} value={inv.shipDispatchAddress} onChange={(e) => setInv({ ...inv, shipDispatchAddress: e.target.value })} />
              </div>
            </div>
          )}
        </div>
      )}

      {!isCommissionInvoice(inv) && (
        <div className="lg-card" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Transport details</label>
            <input value={inv.transportName} onChange={(e) => setInv({ ...inv, transportName: e.target.value })} placeholder="Transporter name" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Vehicle no</label>
            <input value={inv.vehicleNo} onChange={(e) => setInv({ ...inv, vehicleNo: e.target.value })} />
          </div>
        </div>
      )}

      <div className="lg-card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--ink-soft)" }}>
          {isCommissionInvoice(inv) ? "Commission entries" : "Line items"}
        </div>
        {isCommissionInvoice(inv) ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "110px 1.4fr 100px 100px 100px 30px", gap: 8, marginBottom: 6 }}>
              <label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Date</label>
              <label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Party name</label>
              <label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Total weight</label>
              <label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Commission (rate)</label>
              <label style={{ fontSize: 11, color: "var(--ink-soft)" }}>Amount</label>
              <span />
            </div>
            {inv.lineItems.map((li) => (
              <div key={li.id} style={{ display: "grid", gridTemplateColumns: "110px 1.4fr 100px 100px 100px 30px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <input type="date" value={li.date} onChange={(e) => updateLine(li.id, { date: e.target.value })} />
                <input placeholder="Party name" value={li.partyName} onChange={(e) => updateLine(li.id, { partyName: e.target.value })} />
                <input type="number" min="0" step="0.01" placeholder="Weight" value={li.weight} onChange={(e) => updateLine(li.id, { weight: e.target.value })} />
                <input type="number" min="0" step="0.01" placeholder="Rate" value={li.commission} onChange={(e) => updateLine(li.id, { commission: e.target.value })} />
                <input className="lg-mono" disabled value={money((Number(li.weight) || 0) * (Number(li.commission) || 0), symbol)} />
                <button className="lg-btn-danger" style={{ padding: "6px 8px" }} onClick={() => removeLine(li.id)}><Trash2 size={12} /></button>
              </div>
            ))}
          </>
        ) : (
          inv.lineItems.map((li) => (
            <div key={li.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 90px 60px 70px 90px 30px", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <select onChange={(e) => e.target.value && pickCatalogItem(li.id, e.target.value)} defaultValue="">
                <option value="">From catalog…</option>
                {data.items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
              </select>
              <input placeholder="Description" value={li.description} onChange={(e) => updateLine(li.id, { description: e.target.value })} />
              <input placeholder="HSN/SAC" value={li.hsnCode} onChange={(e) => updateLine(li.id, { hsnCode: e.target.value })} />
              <input type="number" min="0" step="1" placeholder="Qty" value={li.qty} onChange={(e) => updateLine(li.id, { qty: e.target.value })} />
              <input placeholder="Unit" value={li.unit} onChange={(e) => updateLine(li.id, { unit: e.target.value })} />
              <input type="number" min="0" step="0.01" placeholder="Rate" value={li.price} onChange={(e) => updateLine(li.id, { price: e.target.value })} />
              <button className="lg-btn-danger" style={{ padding: "6px 8px" }} onClick={() => removeLine(li.id)}><Trash2 size={12} /></button>
            </div>
          ))
        )}
        <button className="lg-btn-ghost" onClick={addLine}><Plus size={13} /> Add line</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <div className="lg-card">
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Remarks <span style={{ fontWeight: 400 }}>— only prints if filled in</span></label>
          <textarea rows={5} value={inv.notes} onChange={(e) => setInv({ ...inv, notes: e.target.value })} placeholder="Optional — leave blank to hide this row on the printed invoice" />
        </div>
        <div className="lg-card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Tax rate (%) <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}>— auto, from state type</span></label>
            <input type="number" style={{ width: 100 }} value={inv.taxRate} disabled />
          </div>
          <div className="lg-row-line" style={{ paddingBottom: 8, marginBottom: 8, fontSize: 13, display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal</span><span className="lg-mono">{money(totals.subtotal, symbol)}</span>
          </div>
          <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>{inv.stateType === "intra" ? `SGST 9% + CGST 9%` : inv.stateType === "inter" ? "IGST 18%" : "Tax"}</span><span className="lg-mono">{money(totals.taxAmount, symbol)}</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span>Total</span><span className="lg-mono">{money(totals.total, symbol)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button className="lg-btn" onClick={handleSave}>Save invoice</button>
        <select value={inv.status} onChange={(e) => setInv({ ...inv, status: e.target.value })} style={{ width: 140 }}>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
        </select>
      </div>
    </div>
  );
}