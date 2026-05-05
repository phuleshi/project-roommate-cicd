import { useLanguage } from "../../context/LanguageContext";

function InvoiceCard({ invoice }) {
  const { t, locale } = useLanguage();
  const statusLabel =
    invoice.status === "paid"
      ? t("invoice.paid")
      : invoice.status === "unpaid"
        ? t("invoice.unpaid")
        : invoice.status === "processing"
          ? t("invoice.statusProcessing")
          : invoice.status === "completed"
            ? t("invoice.statusCompleted")
            : invoice.status;

  return (
    <div
      className={`invoice-card
        ${invoice.isMyDebt ? "highlight" : ""}
        ${invoice.status === "paid" ? "paid" : ""}`}
    >
      <div className="invoice-info">
        <h4>{invoice.title}</h4>
        <p>{invoice.roomName}</p>
        <p>{t("misc.invoiceCardDue", { date: invoice.dueDate })}</p>
      </div>

      <div className="invoice-meta">
        <span className="amount">{invoice.amount.toLocaleString(locale)} {t("common.currencySuffix")}</span>
        <span className={`status ${invoice.status}`}>{statusLabel}</span>
      </div>
    </div>
  );
}

export default InvoiceCard;
