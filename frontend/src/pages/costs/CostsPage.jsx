import { useEffect, useState } from "react";
import { createExpense, deleteExpense, getExpenses } from "../../services/financeService";
import { getMyRoom } from "../../services/roomService";
import { useLanguage } from "../../context/LanguageContext";
import "./CostsPage.css";

function CostsPage() {
  const currentDate = new Date();
  const [room, setRoom] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(currentDate.toISOString().split("T")[0]);
  const [paidBy, setPaidBy] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const { t, locale } = useLanguage();

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const myRoom = await getMyRoom();
      setRoom(myRoom);

      const currentUser = JSON.parse(localStorage.getItem("user"));
      if (currentUser && !paidBy) {
        setPaidBy(currentUser.id.toString());
      }

      if (myRoom && selectedParticipants.length === 0) {
        setSelectedParticipants(myRoom.members.map((member) => member.id.toString()));
      }

      if (myRoom) {
        const expenseData = await getExpenses(selectedMonth, selectedYear);
        setExpenses(expenseData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewTitle("");
    setNewAmount("");
    setNewDate(currentDate.toISOString().split("T")[0]);
  };

  const handleAddExpense = async (event) => {
    event.preventDefault();
    if (!newTitle || !newAmount || !paidBy || selectedParticipants.length === 0) {
      window.alert(t("costs.missingInfo"));
      return;
    }

    try {
      await createExpense({
        title: newTitle,
        amount: parseFloat(newAmount),
        paid_by: parseInt(paidBy, 10),
        created_at: newDate,
        participant_ids: selectedParticipants.map((id) => parseInt(id, 10)),
      });
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      window.alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("costs.confirmDelete"))) return;
    try {
      await deleteExpense(id);
      fetchData();
    } catch (err) {
      window.alert(err.message);
    }
  };

  const toggleParticipant = (userId) => {
    const id = userId.toString();
    setSelectedParticipants((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]
    );
  };

  if (loading) {
    return <div className="costs-loading">{t("costs.loading")}</div>;
  }

  if (!room) {
    return <div className="costs-error">{t("common.noRoom")}</div>;
  }

  const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);
  const yearOptions = [2024, 2025, 2026, 2027];

  return (
    <div className="costs-container">
      <div className="costs-header">
        <div>
          <h2 className="page-title">{t("costs.pageTitle")}</h2>
          <p className="page-subtitle">{t("costs.subtitle")}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + {t("costs.addExpense")}
        </button>
      </div>

      {error && <div className="costs-error">{error}</div>}

      <div className="costs-filter-card">
        <div className="filter-group">
          <label>{t("costs.month")}</label>
          <select value={selectedMonth} onChange={(event) => setSelectedMonth(parseInt(event.target.value, 10))}>
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {t("common.monthLabel", { month })}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>{t("costs.year")}</label>
          <select value={selectedYear} onChange={(event) => setSelectedYear(parseInt(event.target.value, 10))}>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="total-summary">
          <span>
            {t("costs.totalExpense")} <strong>{totalAmount.toLocaleString(locale)} {t("common.currencySuffix")}</strong>
          </span>
        </div>
      </div>

      <div className="expenses-list">
        {expenses.length === 0 ? (
          <div className="empty-state">
            {t("costs.empty", { month: selectedMonth, year: selectedYear })}
          </div>
        ) : (
          expenses.map((expense) => (
            <div key={expense.id} className="expense-card">
              <div className="expense-main">
                <div className="expense-icon">💰</div>
                <div className="expense-info">
                  <h3>{expense.title}</h3>
                  <p className="expense-date">
                    {new Date(expense.created_at).toLocaleDateString(locale)}
                  </p>
                </div>
                <div className="expense-amount">
                  <strong>
                    {parseFloat(expense.amount).toLocaleString(locale)} {t("common.currencySuffix")}
                  </strong>
                </div>
              </div>

              <div className="expense-details">
                <div className="detail-item">
                  <span className="label">{t("costs.paidBy")}:</span>
                  <span className="value">
                    {expense.paid_by_name} {expense.paid_by === currentUser.id ? t("costs.currentUser") : ""}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">{t("costs.participants")}:</span>
                  <span className="value">{expense.participants.map((item) => item.full_name).join(", ")}</span>
                </div>
              </div>

              <div className="expense-actions">
                <button className="btn-icon-danger" onClick={() => handleDelete(expense.id)}>
                  {t("costs.delete")}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{t("costs.modalTitle")}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="expense-form">
              <div className="form-group">
                <label>{t("costs.expenseNameLabel")}</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder={t("costs.expenseNamePlaceholder")}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t("costs.amountLabel")}</label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(event) => setNewAmount(event.target.value)}
                  required
                  min="0"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t("costs.dateLabel")}</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(event) => setNewDate(event.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t("costs.payerLabel")}</label>
                  <select value={paidBy} onChange={(event) => setPaidBy(event.target.value)} required>
                    {room.members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name} {member.id === currentUser.id ? t("costs.currentUser") : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>{t("costs.participantLabel")}</label>
                <div className="participants-checkboxes">
                  {room.members.map((member) => (
                    <label key={member.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(member.id.toString())}
                        onChange={() => toggleParticipant(member.id)}
                      />
                      {member.full_name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  {t("costs.cancel")}
                </button>
                <button type="submit" className="btn-primary">
                  {t("costs.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CostsPage;
