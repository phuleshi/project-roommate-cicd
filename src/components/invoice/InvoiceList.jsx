import InvoiceCard from "./InvoiceCard";
import "./InvoiceList.css";

function InvoiceList({ invoices }) {
  return (
    <div className="invoice-list">
      {invoices.map((inv) => (
        <InvoiceCard key={inv.id} invoice={inv} />
      ))}
    </div>
  );
}

export default InvoiceList;
