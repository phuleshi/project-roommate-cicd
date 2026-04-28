import InvoiceList from "../../components/invoice/InvoiceList";
import "./CostsPage.css";

function CostsPage() {
  const invoices = [
    {
      id: 1,
      title: "Electricity Bill",
      roomName: "Room 101",
      amount: 1200000,
      dueDate: "2026-02-05",
      status: "pending",
      isMyDebt: true,
    },
    {
      id: 2,
      title: "Water Bill",
      roomName: "Room 202",
      amount: 300000,
      dueDate: "2026-02-01",
      status: "paid",
      isMyDebt: false,
    },
  ];

  return (
    <div className="costs-page">
      {/* Sidebar */}
      <InvoiceList invoices={invoices} />

      {/* Main content */}
      <div className="costs-page__content">
        <h2 className="costs-page__title">All Costs</h2>

        {/* Nội dung chi tiết invoice sau này */}
        <p>Chọn một hóa đơn bên trái để xem chi tiết.</p>
      </div>
    </div>
  );
}

export default CostsPage;
