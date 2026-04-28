import { useState } from "react";

export default function MembersTab() {
  const [members, setMembers] = useState([
    { id: 1, name: "Phú", role: "Admin" },
    { id: 2, name: "Nam", role: "Member" },
    { id: 3, name: "Hùng", role: "Member" },
  ]);

  return (
    <div>
      <h3>Thành viên phòng</h3>

      {members.map((m) => (
        <div key={m.id} className="item-row">
          <span>{m.name}</span>
          <span>{m.role}</span>
        </div>
      ))}
    </div>
  );
}