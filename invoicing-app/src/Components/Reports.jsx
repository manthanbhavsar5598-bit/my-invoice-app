import React, { useState, useMemo } from "react";
import { Filter } from "lucide-react";
import { computeTotals, money, displayStatus, fmtDate } from "../utils/helpers";

const TAB_TYPES = [
  { id: "sales", label: "Sales Report" },
  { id: "monthly", label: "Monthly Revenue" },
  { id: "yearly", label: "Yearly Revenue" },
  { id: "customer", label: "Customer-wise Revenue" },
  { id: "pending", label: "Pending Bills" },
  { id: "paid", label: "Paid Bills" },
];

export default function Reports({ data, clientsById, profiles = [] }) {
  const symbol = data.settings.currencySymbol;

  // Navigation tab state
  const [activeTab, setActiveTab] = useState("sales");

  // Form Filter state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [billTypeFilter, setBillTypeFilter] = useState("all");

  // Applied filters state (triggered on "Apply" click)
  const [appliedFilters, setAppliedFilters] = useState({
    from: "",
    to: "",
    company: "all",
    customer: "all",
    status: "all",
    billType: "all",
  });

  // Company profiles for the filter dropdown - no "primary" entry, just
  // whatever profiles the user has created.
  const companyProfilesList = useMemo(() => {
    const source = profiles.length > 0 ? profiles : (data.profiles || []);
    const list = [];
    source.forEach((p) => {
      if (p.name && !list.some((item) => item.name === p.name)) {
        list.push({ id: p.id, name: p.name });
      }
    });
    return list;
  }, [data.profiles, profiles]);

  const handleApply = (e) => {
    e.preventDefault();
    setAppliedFilters({
      from: fromDate,
      to: toDate,
      company: companyFilter,
      customer: customerFilter,
      status: statusFilter,
      billType: billTypeFilter,
    });
  };

  // Filtered dataset logic
  const filteredInvoices = useMemo(() => {
    return data.invoices.filter((inv) => {
      const status = displayStatus(inv);

      // Tab pre-filter
      if (activeTab === "pending" && status !== "sent" && status !== "overdue") return false;
      if (activeTab === "paid" && status !== "paid") return false;

      // Date range filter
      if (appliedFilters.from && (inv.issueDate || "") < appliedFilters.from) return false;
      if (appliedFilters.to && (inv.issueDate || "") > appliedFilters.to) return false;

      // Company profile filter
      if (appliedFilters.company !== "all") {
        const profile = (data.profiles || []).find((p) => p.id === inv.companyProfileId);
        const invoiceCompany = inv.businessName || inv.companyName || profile?.name;
        if (invoiceCompany !== appliedFilters.company) return false;
      }

      // Customer filter
      if (appliedFilters.customer !== "all" && inv.clientId !== appliedFilters.customer) return false;

      // Status filter
      if (appliedFilters.status !== "all" && status !== appliedFilters.status) return false;

      // Bill Type filter
      if (appliedFilters.billType !== "all" && inv.billType !== appliedFilters.billType) return false;

      return true;
    });
  }, [data.invoices, data.profiles, activeTab, appliedFilters]);

  // Aggregate totals
  const totalRevenue = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + computeTotals(inv).total, 0);
  }, [filteredInvoices]);

  return (
    <div style={{ background: "#FAFAFA", minHeight: "100vh", padding: "24px 32px", borderRadius: 12 }}>
      
      {/* Header & Tab Navigation Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        <h1 className="lg-display" style={{ fontSize: 32, fontWeight: 700, margin: 0, color: "#1F2A3C" }}>
          Reports
        </h1>

        {/* Tab Switcher Bar */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          background: "#EFEFEF", 
          padding: "4px", 
          borderRadius: "10px", 
          gap: 2,
          overflowX: "auto",
          maxWidth: "100%"
        }}>
          {TAB_TYPES.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  border: "none",
                  background: isActive ? "#FFFFFF" : "transparent",
                  color: isActive ? "#111827" : "#6B7280",
                  fontWeight: isActive ? "700" : "500",
                  fontSize: 13,
                  padding: "8px 16px",
                  borderRadius: "7px",
                  cursor: "pointer",
                  boxShadow: isActive ? "0px 1px 3px rgba(0, 0, 0, 0.1)" : "none",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap"
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Options Bar */}
      <form onSubmit={handleApply} style={{ marginBottom: 28 }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
          gap: 16, 
          alignItems: "flex-end",
          marginBottom: 16
        }}>
          {/* From Date */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                fontSize: 13,
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                background: "#FFFFFF",
                color: "#374151",
                outline: "none"
              }}
            />
          </div>

          {/* To Date */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>
              To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                fontSize: 13,
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                background: "#FFFFFF",
                color: "#374151",
                outline: "none"
              }}
            />
          </div>

          {/* Company Profiles Dropdown */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>
              Company
            </label>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                fontSize: 13,
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                background: "#FFFFFF",
                color: "#374151",
                outline: "none"
              }}
            >
              <option value="all">All Companies</option>
              {companyProfilesList.map((comp) => (
                <option key={comp.id} value={comp.name}>
                  {comp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Customer */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>
              Customer
            </label>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                fontSize: 13,
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                background: "#FFFFFF",
                color: "#374151",
                outline: "none"
              }}
            >
              <option value="all">All Customers</option>
              {Object.values(clientsById || {}).map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                fontSize: 13,
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                background: "#FFFFFF",
                color: "#374151",
                outline: "none"
              }}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Bill Type */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>
              Bill Type
            </label>
            <select
              value={billTypeFilter}
              onChange={(e) => setBillTypeFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                fontSize: 13,
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                background: "#FFFFFF",
                color: "#374151",
                outline: "none"
              }}
            >
              <option value="all">All Types</option>
              <option value="Tax Invoice">Tax Invoice</option>
              <option value="Commission Invoice">Commission Invoice</option>
            </select>
          </div>
        </div>

        {/* Apply Button */}
        <div>
          <button
            type="submit"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#0F172A",
              color: "#FFFFFF",
              border: "none",
              padding: "9px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
            }}
          >
            <Filter size={14} /> Apply
          </button>
        </div>
      </form>

      {/* Report Summary Card */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: 12,
        padding: "20px 24px",
        marginBottom: 24,
        border: "1px solid #E5E7EB",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <div style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>Total Filtered Invoices</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#111827", marginTop: 2 }}>
            {filteredInvoices.length}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>Total Amount</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#059669", marginTop: 2 }}>
            {money(totalRevenue, symbol)}
          </div>
        </div>
      </div>

      {/* Filtered Data Table */}
      <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 20, border: "1px solid #E5E7EB" }}>
        {filteredInvoices.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#6B7280", fontSize: 14 }}>
            No records match the selected filters.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="lg-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "#6B7280", fontSize: 12, textAlign: "left", borderBottom: "1px solid #E5E7EB" }}>
                  <th style={{ padding: "10px 12px" }}>Invoice No</th>
                  <th style={{ padding: "10px 12px" }}>Company</th>
                  <th style={{ padding: "10px 12px" }}>Date</th>
                  <th style={{ padding: "10px 12px" }}>Customer</th>
                  <th style={{ padding: "10px 12px" }}>Status</th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const clientName = clientsById[inv.clientId]?.name || "Deleted Customer";
                  const status = displayStatus(inv);
                  const invProfile = (data.profiles || []).find((p) => p.id === inv.companyProfileId);
                  const companyName = inv.businessName || inv.companyName || invProfile?.name;

                  return (
                    <tr key={inv.id} style={{ borderBottom: "1px solid #F3F4F6", fontSize: 13 }}>
                      <td className="lg-mono" style={{ padding: "12px", fontWeight: 600 }}>{inv.number}</td>
                      <td style={{ padding: "12px", color: "#374151" }}>{companyName}</td>
                      <td style={{ padding: "12px", color: "#4B5563" }}>{fmtDate(inv.issueDate)}</td>
                      <td style={{ padding: "12px", fontWeight: 500 }}>{clientName}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: status === "paid" ? "#E8F1EB" : status === "overdue" ? "#FBE9E6" : "#F3F4F6",
                          color: status === "paid" ? "#2F5540" : status === "overdue" ? "#C0392B" : "#4B5563"
                        }}>
                          {status}
                        </span>
                      </td>
                      <td className="lg-mono" style={{ padding: "12px", textAlign: "right", fontWeight: 600 }}>
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