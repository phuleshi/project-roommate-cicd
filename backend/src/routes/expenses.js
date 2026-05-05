import express from "express";
import db from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Helper: Lấy thông tin phòng của user hiện tại
async function getUserRoom(userId) {
  const [rows] = await db.execute(
    "SELECT room_id, role FROM room_members WHERE user_id = ?",
    [userId]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

// 1. Lấy danh sách chi phí theo tháng
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Thiếu tháng và năm" });
    }

    const membership = await getUserRoom(userId);
    if (!membership) {
      return res.status(400).json({ message: "Bạn chưa tham gia phòng nào" });
    }

    const roomId = membership.room_id;

    // Lấy expenses
    const [expenses] = await db.execute(
      `SELECT e.*, u.full_name as paid_by_name 
       FROM expenses e 
       JOIN users u ON e.paid_by = u.id 
       WHERE e.room_id = ? AND MONTH(e.created_at) = ? AND YEAR(e.created_at) = ?
       ORDER BY e.created_at DESC`,
      [roomId, month, year]
    );

    // Lấy participants cho mỗi expense
    for (let exp of expenses) {
      const [parts] = await db.execute(
        `SELECT ep.user_id, u.full_name 
         FROM expense_participants ep
         JOIN users u ON ep.user_id = u.id
         WHERE ep.expense_id = ?`,
        [exp.id]
      );
      exp.participants = parts;
    }

    res.json({ expenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. Thêm chi phí mới
router.post("/", authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;
    const { title, amount, paid_by, created_at, participant_ids } = req.body;

    if (!title || !amount || !paid_by || !created_at || !participant_ids || participant_ids.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Thiếu thông tin chi phí" });
    }

    const membership = await getUserRoom(userId);
    if (!membership) {
      await connection.rollback();
      return res.status(400).json({ message: "Bạn chưa tham gia phòng nào" });
    }

    const roomId = membership.room_id;

    // Phân tích ngày để kiểm tra xem tháng này đã chốt hóa đơn chưa
    const expDate = new Date(created_at);
    const expMonth = expDate.getMonth() + 1;
    const expYear = expDate.getFullYear();

    const [invoices] = await connection.execute(
      "SELECT id FROM invoices WHERE room_id = ? AND month = ? AND year = ?",
      [roomId, expMonth, expYear]
    );

    if (invoices.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Tháng này đã được chốt hóa đơn, không thể thêm chi phí mới." });
    }

    // Insert expense
    const [result] = await connection.execute(
      "INSERT INTO expenses (room_id, title, amount, paid_by, created_at) VALUES (?, ?, ?, ?, ?)",
      [roomId, title, amount, paid_by, created_at]
    );
    const expenseId = result.insertId;

    // Insert participants
    for (let p_id of participant_ids) {
      await connection.execute(
        "INSERT INTO expense_participants (expense_id, user_id) VALUES (?, ?)",
        [expenseId, p_id]
      );
    }

    await connection.commit();
    res.status(201).json({ message: "Thêm chi phí thành công", expenseId });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});

// 3. Xóa chi phí
router.delete("/:id", authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;
    const expenseId = req.params.id;

    const membership = await getUserRoom(userId);
    if (!membership) {
      await connection.rollback();
      return res.status(400).json({ message: "Bạn chưa tham gia phòng nào" });
    }
    const roomId = membership.room_id;
    const isAdmin = membership.role === "admin";

    // Lấy thông tin expense
    const [expenses] = await connection.execute(
      "SELECT * FROM expenses WHERE id = ? AND room_id = ?",
      [expenseId, roomId]
    );

    if (expenses.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Không tìm thấy chi phí" });
    }

    const exp = expenses[0];

    // Chỉ người ứng tiền hoặc admin mới được xóa
    if (exp.paid_by !== userId && !isAdmin) {
      await connection.rollback();
      return res.status(403).json({ message: "Chỉ người tạo hoặc quản trị viên mới được xóa chi phí này" });
    }

    // Kiểm tra hóa đơn
    const expDate = new Date(exp.created_at);
    const expMonth = expDate.getMonth() + 1;
    const expYear = expDate.getFullYear();

    const [invoices] = await connection.execute(
      "SELECT id FROM invoices WHERE room_id = ? AND month = ? AND year = ?",
      [roomId, expMonth, expYear]
    );

    if (invoices.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Tháng này đã được chốt hóa đơn, không thể xóa chi phí." });
    }

    await connection.execute("DELETE FROM expense_participants WHERE expense_id = ?", [expenseId]);
    await connection.execute("DELETE FROM expenses WHERE id = ?", [expenseId]);

    await connection.commit();
    res.json({ message: "Xóa chi phí thành công" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});

export default router;
