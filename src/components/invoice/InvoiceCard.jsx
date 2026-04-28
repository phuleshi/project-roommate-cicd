function InvoiceCard({ invoice }) {
  return (
    <div
      className={`invoice-card
        ${invoice.isMyDebt ? "highlight" : ""}
        ${invoice.status === "paid" ? "paid" : ""}`}
    >
      <div className="invoice-info">
        <h4>{invoice.title}</h4>
        <p>{invoice.roomName}</p>
        <p>Due: {invoice.dueDate}</p>
      </div>

      <div className="invoice-meta">
        <span className="amount">
          {invoice.amount.toLocaleString()} VND
        </span>
        <span className={`status ${invoice.status}`}>
          {invoice.status}
        </span>
      </div>
    </div>
  );
}

export default InvoiceCard;
