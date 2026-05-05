import { useEffect, useState } from "react";
import {
  confirmPayment,
  createInvoice,
  getExpenses,
  getInvoiceDetails,
  getInvoices,
  payInvoice,
} from "../../services/financeService";
import { getMyRoom } from "../../services/roomService";
import { useLanguage } from "../../context/LanguageContext";
import "./InvoicePage.css";

function InvoicePage() {
  const currentDate = new Date();
  const [room, setRoom] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [details, setDetails] = useState([]);
  const [createMonth, setCreateMonth] = useState(currentDate.getMonth() + 1);
  const [createYear, setCreateYear] = useState(currentDate.getFullYear());
  const [previewExpenses, setPreviewExpenses] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t, locale } = useLanguage();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (room && room.currentUserRole === "admin") {
      fetchPreviewExpenses();
    }
  }, [createMonth, createYear, room]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const myRoom = await getMyRoom();
      setRoom(myRoom);

      if (myRoom) {
        const invoiceData = await getInvoices();
        setInvoices(invoiceData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviewExpenses = async () => {
    setPreviewLoading(true);
    try {
      const expenseData = await getExpenses(createMonth, createYear);
      setPreviewExpenses(expenseData);
    } catch (_err) {
      setPreviewExpenses([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSelectInvoice = async (invoice) => {
    try {
      const data = await getInvoiceDetails(invoice.id);
      setSelectedInvoice(data.invoice);
      setDetails(data.details);
    } catch (err) {
      window.alert(err.message);
    }
  };

  const handleOpenConfirmModal = () => {
    if (previewExpenses.length === 0) {
      window.alert(t("invoice.alertNoPreview"));
      return;
    }
    setShowConfirmModal(true);
  };

  const handleCreateInvoice = async () => {
    setIsSubmitting(true);
    try {
      await createInvoice(createMonth, createYear);
      setShowConfirmModal(false);
      fetchData();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePay = async (invoiceId) => {
    try {
      await payInvoice(invoiceId);
      const data = await getInvoiceDetails(invoiceId);
      setSelectedInvoice(data.invoice);
      setDetails(data.details);
      window.alert(t("invoice.paymentReported"));
    } catch (err) {
      window.alert(err.message);
    }
  };

  const handleConfirm = async (invoiceId, userId) => {
    try {
      await confirmPayment(invoiceId, userId);
      const data = await getInvoiceDetails(invoiceId);
      setSelectedInvoice(data.invoice);
      setDetails(data.details);
      fetchData();
      window.alert(t("invoice.paymentConfirmed"));
    } catch (err) {
      window.alert(err.message);
    }
  };

  const getStatusMeta = (status) => {
    switch (status) {
      case "completed":
        return t("invoice.statusCompleted");
      case "processing":
        return t("invoice.statusProcessing");
      default:
        return t("invoice.statusPending");
    }
  };

  if (loading) {
    return <div className="invoice-loading">{t("invoice.loading")}</div>;
  }

  if (!room) {
    return <div className="invoice-error">{t("common.noRoom")}</div>;
  }

  const isAdmin = room.currentUserRole === "admin";
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const previewTotal = previewExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);
  const yearOptions = [2024, 2025, 2026, 2027];

  return (
    <div className="invoice-container">
      <div className="invoice-header">
        <div>
          <h2 className="page-title">{t("invoice.pageTitle")}</h2>
          <p className="page-subtitle">{t("invoice.subtitle")}</p>
        </div>
      </div>

      {error && <div className="invoice-error">{error}</div>}

      <div className="invoice-layout">
        <div className="invoice-sidebar">
          {isAdmin && (
            <div className="create-invoice-card">
              <h3>{t("invoice.createTitle")}</h3>
              <p>{t("invoice.createBody")}</p>
              <div className="create-inputs">
                <select value={createMonth} onChange={(event) => setCreateMonth(parseInt(event.target.value, 10))}>
                  {monthOptions.map((month) => (
                    <option key={month} value={month}>
                      {t("invoice.monthOption", { month })}
                    </option>
                  ))}
                </select>
                <select value={createYear} onChange={(event) => setCreateYear(parseInt(event.target.value, 10))}>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="preview-expenses-box">
                {previewLoading ? (
                  <div className="preview-status">{t("invoice.previewLoading")}</div>
                ) : previewExpenses.length === 0 ? (
                  <div className="preview-status empty">{t("invoice.previewEmpty")}</div>
                ) : (
                  <>
                    <ul className="preview-list">
                      {previewExpenses.map((expense) => (
                        <li key={expense.id}>
                          <span className="exp-title">{expense.title}</span>
                          <span className="exp-amount">
                            {parseFloat(expense.amount).toLocaleString(locale)}đ
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="preview-total">
                      {t("invoice.previewTotal")}{" "}
                      <strong>{previewTotal.toLocaleString(locale)} {t("common.currencySuffix")}</strong>
                    </div>
                  </>
                )}
              </div>

              <button
                className="btn-primary full-width"
                onClick={handleOpenConfirmModal}
                disabled={previewExpenses.length === 0}
              >
                {t("invoice.proceedButton")}
              </button>
            </div>
          )}

          <div className="invoice-list">
            <h3>{t("invoice.listTitle")}</h3>
            {invoices.length === 0 ? (
              <p className="empty-text">{t("invoice.emptyList")}</p>
            ) : (
              invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className={`invoice-card ${selectedInvoice?.id === invoice.id ? "active" : ""}`}
                  onClick={() => handleSelectInvoice(invoice)}
                >
                  <div className="invoice-card-header">
                    <h4>{t("invoice.invoiceFor", { month: invoice.month, year: invoice.year })}</h4>
                    <span className={`status-badge ${invoice.status}`}>{getStatusMeta(invoice.status)}</span>
                  </div>
                  <div className="invoice-card-body">
                    <span>
                      {t("invoice.totalAmount")}:{" "}
                      <strong>
                        {parseFloat(invoice.total_amount).toLocaleString(locale)} {t("common.currencySuffix")}
                      </strong>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="invoice-content">
          {!selectedInvoice ? (
            <div className="empty-detail">
              <div className="empty-icon">📄</div>
              <p>{t("invoice.selectPrompt")}</p>
            </div>
          ) : (
            <div className="detail-card">
              <div className="detail-header">
                <h2>
                  {t("invoice.detailTitle", {
                    month: selectedInvoice.month,
                    year: selectedInvoice.year,
                  })}
                </h2>
                <div className="detail-summary">
                  <span>
                    {t("invoice.roomSpent")}{" "}
                    <strong>
                      {parseFloat(selectedInvoice.total_amount).toLocaleString(locale)} {t("common.currencySuffix")}
                    </strong>
                  </span>
                  <span className={`status-badge ${selectedInvoice.status}`}>
                    {selectedInvoice.status === "completed"
                      ? t("invoice.invoiceDone")
                      : t("invoice.invoiceInProgress")}
                  </span>
                </div>
              </div>

              <div className="debt-list">
                <h3>{t("invoice.debtTable")}</h3>
                {details.map((detail) => {
                  const debtAmount = parseFloat(detail.amount);
                  const isCurrentUser = detail.user_id === currentUser.id;

                  return (
                    <div key={detail.id} className={`debt-card ${isCurrentUser ? "is-me" : ""}`}>
                      <div className="debt-user">
                        <div className="avatar">{detail.full_name.charAt(0)}</div>
                        <div>
                          <h4>
                            {detail.full_name} {isCurrentUser ? t("invoice.currentUser") : ""}
                          </h4>
                          <p>{detail.email}</p>
                        </div>
                      </div>

                      <div className="debt-info">
                        {debtAmount <= 0 ? (
                          <div className="debt-status positive">
                            {t("invoice.noDebt", {
                              amount: `${Math.abs(debtAmount).toLocaleString(locale)} ${t("common.currencySuffix")}`,
                            })}
                          </div>
                        ) : (
                          <>
                            <div className="debt-amount">
                              {t("invoice.amountDue")}{" "}
                              <strong>
                                {debtAmount.toLocaleString(locale)} {t("common.currencySuffix")}
                              </strong>
                            </div>
                            <div className="debt-status-badge">
                              {t("invoice.paymentStatus")}{" "}
                              <span className={detail.status}>
                                {detail.status === "paid" ? t("invoice.paid") : t("invoice.unpaid")}
                              </span>
                            </div>

                            <div className="debt-actions">
                              {isCurrentUser && detail.status === "unpaid" && (
                                <button className="btn-pay" onClick={() => handlePay(selectedInvoice.id)}>
                                  {t("invoice.reportPaid")}
                                </button>
                              )}
                              {isAdmin && detail.status === "unpaid" && (
                                <button
                                  className="btn-confirm"
                                  onClick={() => handleConfirm(selectedInvoice.id, detail.user_id)}
                                >
                                  {t("invoice.confirmReceived")}
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {showConfirmModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-content">
            <div className="confirm-icon">⚠️</div>
            <h3>{t("invoice.confirmModalTitle", { month: createMonth, year: createYear })}</h3>
            <div className="confirm-details">
              <p>
                {t("invoice.confirmModalBody", {
                  count: previewExpenses.length,
                  total: `${previewTotal.toLocaleString(locale)} ${t("common.currencySuffix")}`,
                })}
              </p>
              <ul className="confirm-warnings">
                <li>{t("invoice.confirmWarning1")}</li>
                <li>{t("invoice.confirmWarning2")}</li>
                <li>{t("invoice.confirmWarning3")}</li>
              </ul>
            </div>
            <div className="confirm-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
              >
                {t("invoice.confirmCancel")}
              </button>
              <button className="btn-danger" onClick={handleCreateInvoice} disabled={isSubmitting}>
                {isSubmitting ? t("invoice.submitting") : t("invoice.confirmAccept")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoicePage;
