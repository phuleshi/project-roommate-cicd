import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

export default function CostsTab() {
  const [expenses] = useState([
    { id: 1, name: "Electricity", amount: 900000, paidBy: "Phu" },
    { id: 2, name: "Water", amount: 200000, paidBy: "Nam" },
  ]);
  const { t, locale } = useLanguage();

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div>
      <h3>{t("misc.costsTabTitle")}</h3>
      <p>
        <b>{t("common.total")}:</b> {total.toLocaleString(locale)} {t("common.currencySuffix")}
      </p>

      {expenses.map((expense) => (
        <div key={expense.id} className="item-row">
          <div>
            <p>{expense.name}</p>
            <small>
              {t("costs.paidBy")}: {expense.paidBy}
            </small>
          </div>
          <span>{expense.amount.toLocaleString(locale)} {t("common.currencySuffix")}</span>
        </div>
      ))}
    </div>
  );
}
