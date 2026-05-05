import { useLanguage } from "../../context/LanguageContext";

export function UserRow({ user, amount }) {
  const { t, locale } = useLanguage();

  return (
    <div className="flex justify-between border p-2 rounded">
      <span>{user.name}</span>
      <span>
        {amount.toLocaleString(locale)} {t("common.currencySuffix")}
      </span>
    </div>
  );
}
