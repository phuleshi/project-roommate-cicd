import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

export default function MembersTab() {
  const { t } = useLanguage();
  const [members] = useState([
    { id: 1, name: "Phu", role: "Admin" },
    { id: 2, name: "Nam", role: "Member" },
    { id: 3, name: "Hung", role: "Member" },
  ]);

  return (
    <div>
      <h3>{t("misc.membersTabTitle")}</h3>

      {members.map((member) => (
        <div key={member.id} className="item-row">
          <span>{member.name}</span>
          <span>{member.role === "Admin" ? t("common.admin") : t("common.member")}</span>
        </div>
      ))}
    </div>
  );
}
