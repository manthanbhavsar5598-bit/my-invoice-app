import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import InvoiceList from "./InvoiceList";
import InvoiceForm from "./InvoiceForm";
import PrintView from "./PrintView";
import { resolveProfile } from "../utils/helpers";

export default function Invoices({ data, clientsById, onDelete, onSetStatus, onSaveInvoice }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [printInvoiceId, setPrintInvoiceId] = useState(null);

  const printInvoice = printInvoiceId ? data.invoices.find((i) => i.id === printInvoiceId) : null;
  const printBusiness = printInvoice ? resolveProfile(data.business, data.businessProfiles, printInvoice.companyProfileId) : data.business;

  if (printInvoice) {
    return <PrintView invoice={printInvoice} business={printBusiness} client={clientsById[printInvoice.clientId]} onClose={() => setPrintInvoiceId(null)} />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <InvoiceList
            data={data}
            clientsById={clientsById}
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
            onNew={() => navigate("/invoices/new")}
            onOpen={(id) => navigate(`/invoices/edit/${id}`)}
            onPrint={(id) => setPrintInvoiceId(id)}
            onDelete={onDelete}
            onSetStatus={onSetStatus}
          />
        }
      />
      <Route
        path="/new"
        element={
          <InvoiceForm
            data={data}
            onSave={(inv, isNew) => {
              onSaveInvoice(inv, isNew);
              navigate("/invoices");
            }}
          />
        }
      />
      <Route
        path="/edit/:id"
        element={
          <InvoiceForm
            data={data}
            onSave={(inv, isNew) => {
              onSaveInvoice(inv, isNew);
              navigate("/invoices");
            }}
          />
        }
      />
    </Routes>
  );
}