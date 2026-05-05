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

router.get("/overview", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const membership = await getUserRoom(userId);
    if (!membership) return res.status(400).json({ message: "Bạn chưa tham gia phòng nào" });

    const roomId = membership.room_id;

    // 1. Expense Trend (6 tháng gần nhất)
    // Lấy hóa đơn 6 tháng gần nhất
    const [invoices] = await db.execute(
      `SELECT month, year, total_amount 
       FROM invoices 
       WHERE room_id = ? 
       ORDER BY year DESC, month DESC 
       LIMIT 6`,
      [roomId]
    );

    // Xử lý đảo ngược mảng để vẽ từ cũ đến mới
    const expenseTrend = invoices.reverse().map(inv => ({
      name: `T${inv.month}/${inv.year.toString().slice(2)}`,
      amount: parseFloat(inv.total_amount)
    }));

    // 2. Member Debts (Danh sách nợ chưa trả)
    const [debts] = await db.execute(
      `SELECT u.id, u.full_name, u.email, SUM(d.amount) as total_debt
       FROM invoice_details d
       JOIN invoices i ON d.invoice_id = i.id
       JOIN users u ON d.user_id = u.id
       WHERE i.room_id = ? AND d.status != 'paid' AND d.amount > 0
       GROUP BY u.id, u.full_name, u.email
       ORDER BY total_debt DESC`,
      [roomId]
    );

    const memberDebts = debts.map(d => ({
      ...d,
      total_debt: parseFloat(d.total_debt)
    }));

    // 3. Task Completion (Trong tháng hiện tại)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const [tasks] = await db.execute(
      `SELECT ta.user_id, u.full_name, ta.status
       FROM task_assignments ta
       JOIN tasks t ON ta.task_id = t.id
       JOIN users u ON ta.user_id = u.id
       WHERE t.room_id = ? 
         AND MONTH(ta.assigned_date) = ? 
         AND YEAR(ta.assigned_date) = ?`,
      [roomId, currentMonth, currentYear]
    );

    // Tính toán số liệu
    const taskStatsMap = {};
    for (let t of tasks) {
      if (!taskStatsMap[t.user_id]) {
        taskStatsMap[t.user_id] = { id: t.user_id, name: t.full_name, total: 0, done: 0 };
      }
      taskStatsMap[t.user_id].total++;
      if (t.status === 'done') {
        taskStatsMap[t.user_id].done++;
      }
    }

    const taskStats = Object.values(taskStatsMap).map(ts => ({
      ...ts,
      completionRate: ts.total === 0 ? 0 : Math.round((ts.done / ts.total) * 100)
    }));

    // Bổ sung những thành viên trong phòng chưa có task nào trong tháng này để progress bar = 0
    const [members] = await db.execute(
      `SELECT u.id, u.full_name FROM room_members rm JOIN users u ON rm.user_id = u.id WHERE rm.room_id = ?`,
      [roomId]
    );

    for (let m of members) {
      if (!taskStatsMap[m.id]) {
        taskStats.push({
          id: m.id,
          name: m.full_name,
          total: 0,
          done: 0,
          completionRate: 0
        });
      }
    }

    // Sort by completionRate desc
    taskStats.sort((a, b) => b.completionRate - a.completionRate);

    res.json({
      expenseTrend,
      memberDebts,
      taskStats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
