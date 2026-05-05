import express from "express";
import db from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

async function getUserRoom(userId) {
  const [rows] = await db.execute(
    "SELECT room_id, role FROM room_members WHERE user_id = ?",
    [userId]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

// 1. Lấy danh sách hóa đơn
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const membership = await getUserRoom(userId);
    if (!membership) return res.status(400).json({ message: "Bạn chưa tham gia phòng nào" });

    const roomId = membership.room_id;

    const [invoices] = await db.execute(
      "SELECT * FROM invoices WHERE room_id = ? ORDER BY year DESC, month DESC",
      [roomId]
    );

    res.json({ invoices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. Chi tiết hóa đơn
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;
    const membership = await getUserRoom(userId);
    if (!membership) return res.status(400).json({ message: "Bạn chưa tham gia phòng nào" });

    const roomId = membership.room_id;

    const [invoices] = await db.execute(
      "SELECT * FROM invoices WHERE id = ? AND room_id = ?",
      [invoiceId, roomId]
    );

    if (invoices.length === 0) return res.status(404).json({ message: "Hóa đơn không tồn tại" });
    const invoice = invoices[0];

    const [details] = await db.execute(
      `SELECT d.*, u.full_name, u.email 
       FROM invoice_details d
       JOIN users u ON d.user_id = u.id
       WHERE d.invoice_id = ?`,
      [invoiceId]
    );

    res.json({ invoice, details });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 3. Admin tạo hóa đơn (Chốt tháng)
router.post("/", authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;
    const { month, year } = req.body;

    if (!month || !year) {
      await connection.rollback();
      return res.status(400).json({ message: "Thiếu tháng và năm" });
    }

    const membership = await getUserRoom(userId);
    if (!membership || membership.role !== "admin") {
      await connection.rollback();
      return res.status(403).json({ message: "Chỉ trưởng phòng mới được tạo hóa đơn" });
    }

    const roomId = membership.room_id;

    // Check if already exists
    const [existing] = await connection.execute(
      "SELECT id FROM invoices WHERE room_id = ? AND month = ? AND year = ?",
      [roomId, month, year]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Tháng này đã có hóa đơn rồi" });
    }

    // Get all expenses for that month
    const [expenses] = await connection.execute(
      "SELECT * FROM expenses WHERE room_id = ? AND MONTH(created_at) = ? AND YEAR(created_at) = ?",
      [roomId, month, year]
    );

    if (expenses.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Không có chi phí nào trong tháng này để tạo hóa đơn" });
    }

    // Get room members
    const [members] = await connection.execute(
      "SELECT user_id FROM room_members WHERE room_id = ?",
      [roomId]
    );

    const userDebts = {};
    members.forEach(m => userDebts[m.user_id] = 0);

    let totalAmount = 0;

    // Calculate debts
    for (let exp of expenses) {
      const expAmount = parseFloat(exp.amount);
      totalAmount += expAmount;

      const [parts] = await connection.execute(
        "SELECT user_id FROM expense_participants WHERE expense_id = ?",
        [exp.id]
      );

      if (parts.length > 0) {
        const splitAmount = expAmount / parts.length;
        for (let p of parts) {
          if (userDebts[p.user_id] !== undefined) {
            userDebts[p.user_id] += splitAmount;
          }
        }
      }

      if (userDebts[exp.paid_by] !== undefined) {
        userDebts[exp.paid_by] -= expAmount;
      }
    }

    // Insert invoice
    const [invResult] = await connection.execute(
      "INSERT INTO invoices (room_id, month, year, total_amount, status) VALUES (?, ?, ?, ?, 'pending')",
      [roomId, month, year, totalAmount]
    );
    const invoiceId = invResult.insertId;

    // Insert invoice_details for users who have positive debt or negative debt (to track)
    for (const [uid, debt] of Object.entries(userDebts)) {
      let status = 'unpaid';
      if (debt <= 0) {
        status = 'paid'; // Mặc định những ai không nợ (hoặc âm nợ) là đã trả xong
      }

      await connection.execute(
        "INSERT INTO invoice_details (invoice_id, user_id, amount, status) VALUES (?, ?, ?, ?)",
        [invoiceId, uid, debt, status]
      );
    }

    // Check if everyone is paid (maybe no one owes anything?)
    const [unpaid] = await connection.execute(
      "SELECT id FROM invoice_details WHERE invoice_id = ? AND status != 'paid'",
      [invoiceId]
    );

    if (unpaid.length === 0) {
      await connection.execute("UPDATE invoices SET status = 'completed' WHERE id = ?", [invoiceId]);
    }

    await connection.commit();
    res.status(201).json({ message: "Tạo hóa đơn thành công", invoiceId });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});

// 4. Báo đã thanh toán (Member)
router.post("/:id/pay", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;

    // Only update if it's unpaid
    const [details] = await db.execute(
      "SELECT id, status FROM invoice_details WHERE invoice_id = ? AND user_id = ?",
      [invoiceId, userId]
    );

    if (details.length === 0) return res.status(404).json({ message: "Không tìm thấy công nợ của bạn" });
    if (details[0].status !== 'unpaid') return res.status(400).json({ message: "Bạn đã thanh toán hoặc đang chờ xác nhận" });

    // Cập nhật trạng thái chi tiết hóa đơn (chờ xác nhận -> dùng payment bảng phụ hoặc tạm set status thành một trạng thái trung gian, ở đây ta sẽ dùng status của hóa đơn thành processing nếu cần, nhưng db hiện tại chỉ có 'unpaid' và 'paid'. Ta sẽ dùng 'processing' vào bảng invoices hoặc update trực tiếp invoice_details status thành một enum nếu có. Bảng invoice_details có enum('unpaid', 'paid'). Để cho đơn giản ta có thể thêm logic xác nhận nếu cần, nhưng do DB không có enum 'processing' ở invoice_details, ta chỉ có thể chuyển thẳng sang 'paid' hoặc update invoices.status). 
    // Theo yêu cầu "Thành viên: Bấm Đã thanh toán, Admin xác nhận". 
    // Chúng ta hãy alter DB thêm 'processing' vào invoice_details hoặc tạo bản ghi payments tạm.
    // Cách an toàn hơn: dùng bảng payments để lưu trữ trạng thái chờ.
    
    // Thêm bản ghi vào bảng payments nhưng confirmed_by = NULL
    const invDetailId = details[0].id;
    await db.execute(
      "INSERT INTO payments (invoice_detail_id, paid_amount, confirmed_by) VALUES (?, (SELECT amount FROM invoice_details WHERE id = ?), NULL)",
      [invDetailId, invDetailId]
    );

    // Cập nhật invoice_details thành 'unpaid' nhưng có báo hiệu (có thể dùng subquery khi fetch để biết là đang processing)
    // Để frontend biết, ta có thể update invoice status sang processing
    await db.execute("UPDATE invoices SET status = 'processing' WHERE id = ?", [invoiceId]);

    res.json({ message: "Đã báo thanh toán, chờ Admin xác nhận" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 5. Admin xác nhận nhận tiền
router.post("/:id/confirm/:userId", authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const adminId = req.user.id;
    const invoiceId = req.params.id;
    const targetUserId = req.params.userId;

    const membership = await getUserRoom(adminId);
    if (!membership || membership.role !== "admin") {
      await connection.rollback();
      return res.status(403).json({ message: "Chỉ trưởng phòng mới được xác nhận" });
    }

    const [details] = await connection.execute(
      "SELECT id FROM invoice_details WHERE invoice_id = ? AND user_id = ?",
      [invoiceId, targetUserId]
    );

    if (details.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Không tìm thấy công nợ" });
    }

    const invDetailId = details[0].id;

    // Update invoice_details to 'paid'
    await connection.execute(
      "UPDATE invoice_details SET status = 'paid' WHERE id = ?",
      [invDetailId]
    );

    // Update payment confirmed_by if exists, else create one
    const [payments] = await connection.execute("SELECT id FROM payments WHERE invoice_detail_id = ?", [invDetailId]);
    if (payments.length > 0) {
      await connection.execute("UPDATE payments SET confirmed_by = ?, paid_at = CURRENT_TIMESTAMP WHERE invoice_detail_id = ?", [adminId, invDetailId]);
    } else {
      await connection.execute(
        "INSERT INTO payments (invoice_detail_id, paid_amount, confirmed_by) VALUES (?, (SELECT amount FROM invoice_details WHERE id = ?), ?)",
        [invDetailId, invDetailId, adminId]
      );
    }

    // Check if all are paid
    const [unpaid] = await connection.execute(
      "SELECT id FROM invoice_details WHERE invoice_id = ? AND status != 'paid'",
      [invoiceId]
    );

    if (unpaid.length === 0) {
      await connection.execute("UPDATE invoices SET status = 'completed' WHERE id = ?", [invoiceId]);
    } else {
      // Revert invoice status to pending if it was processing but no one else is processing (optional, we leave it)
    }

    await connection.commit();
    res.json({ message: "Xác nhận thanh toán thành công" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});

export default router;
