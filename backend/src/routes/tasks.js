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

// 1. Lấy danh sách lịch phân công (task_assignments) trong 1 khoảng thời gian
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query; // YYYY-MM-DD

    const membership = await getUserRoom(userId);
    if (!membership) return res.status(400).json({ message: "Bạn chưa tham gia phòng nào" });

    let query = `
      SELECT ta.*, t.title, t.description, t.repeat_type, u.full_name as assignee_name 
      FROM task_assignments ta
      JOIN tasks t ON ta.task_id = t.id
      JOIN users u ON ta.user_id = u.id
      WHERE t.room_id = ?
    `;
    const params = [membership.room_id];

    if (start_date && end_date) {
      query += ` AND ta.assigned_date >= ? AND ta.assigned_date <= ?`;
      params.push(start_date, end_date);
    }

    query += ` ORDER BY ta.assigned_date ASC`;

    const [assignments] = await db.execute(query, params);
    res.json({ assignments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. Tạo công việc & Sinh lịch tự động
router.post("/", authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;
    const { title, description, repeat_type, assignees, start_date } = req.body;
    // assignees: array of user_ids [1, 2, 3]

    if (!title || !repeat_type || !assignees || assignees.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Thiếu thông tin công việc hoặc danh sách người làm" });
    }

    const membership = await getUserRoom(userId);
    if (!membership || membership.role !== "admin") {
      await connection.rollback();
      return res.status(403).json({ message: "Chỉ trưởng phòng mới được tạo công việc" });
    }

    // Tạo Task
    const [taskResult] = await connection.execute(
      "INSERT INTO tasks (room_id, title, description, repeat_type) VALUES (?, ?, ?, ?)",
      [membership.room_id, title, description || '', repeat_type]
    );
    const taskId = taskResult.insertId;

    // Tự động sinh task_assignments cho 30 ngày (hoặc 4 tuần)
    let currentDate = start_date ? new Date(start_date) : new Date();
    currentDate.setHours(0, 0, 0, 0);

    const generatedAssignments = [];
    let assigneeIndex = 0;

    // Sinh 30 lần nếu là daily, hoặc 12 lần (12 tuần) nếu là weekly để có lịch dùng dần.
    const limit = repeat_type === 'daily' ? 30 : 12;

    for (let i = 0; i < limit; i++) {
      const assignedUserId = assignees[assigneeIndex % assignees.length];
      
      const dateStr = currentDate.toISOString().split('T')[0];
      
      generatedAssignments.push([taskId, assignedUserId, dateStr, 'pending']);

      if (repeat_type === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (repeat_type === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      }
      
      assigneeIndex++;
    }

    // Insert multiple
    const placeholders = generatedAssignments.map(() => "(?, ?, ?, ?)").join(", ");
    const flatValues = generatedAssignments.flat();

    await connection.execute(
      `INSERT INTO task_assignments (task_id, user_id, assigned_date, status) VALUES ${placeholders}`,
      flatValues
    );

    await connection.commit();
    res.status(201).json({ message: "Tạo công việc thành công", taskId });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});

// 3. Đánh dấu hoàn thành
router.put("/assignments/:id/done", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const assignmentId = req.params.id;
    const { note } = req.body;

    const [rows] = await db.execute(
      `SELECT ta.*, t.room_id 
       FROM task_assignments ta 
       JOIN tasks t ON ta.task_id = t.id 
       WHERE ta.id = ?`,
      [assignmentId]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy công việc" });
    const assignment = rows[0];

    const membership = await getUserRoom(userId);
    if (!membership || membership.room_id !== assignment.room_id) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    // Nếu người bấm không phải là người được gán, có cho phép hoàn thành hộ không?
    // Thường thì chỉ người được gán hoặc admin mới được check done.
    if (assignment.user_id !== userId && membership.role !== "admin") {
       // Nhưng yêu cầu có "làm hộ", nếu muốn làm hộ thì phải bấm "transfer" trước để đổi tên, sau đó mới done.
       // Hoặc có thể done thẳng. Tạm thời chặn để ép họ dùng nút "Làm hộ".
       return res.status(403).json({ message: "Đây không phải công việc của bạn. Hãy nhấn 'Làm hộ' trước khi hoàn thành." });
    }

    const newStatus = assignment.status === 'pending' ? 'done' : 'pending';

    await db.execute(
      "UPDATE task_assignments SET status = ?, note = ? WHERE id = ?",
      [newStatus, note || assignment.note, assignmentId]
    );

    res.json({ message: "Cập nhật thành công", status: newStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 4. "Làm hộ" (Transfer task to me)
router.put("/assignments/:id/transfer", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const assignmentId = req.params.id;

    const [rows] = await db.execute(
      `SELECT ta.*, t.room_id, u.full_name as original_assignee_name
       FROM task_assignments ta 
       JOIN tasks t ON ta.task_id = t.id 
       JOIN users u ON ta.user_id = u.id
       WHERE ta.id = ?`,
      [assignmentId]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy công việc" });
    const assignment = rows[0];

    const membership = await getUserRoom(userId);
    if (!membership || membership.room_id !== assignment.room_id) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    if (assignment.user_id === userId) {
      return res.status(400).json({ message: "Công việc này vốn dĩ đã là của bạn." });
    }

    if (assignment.status === 'done') {
      return res.status(400).json({ message: "Công việc này đã hoàn thành, không thể làm hộ nữa." });
    }

    await db.execute(
      "UPDATE task_assignments SET user_id = ?, note = ? WHERE id = ?",
      [userId, `Đã nhận làm hộ cho ${assignment.original_assignee_name}`, assignmentId]
    );

    res.json({ message: "Đã chuyển công việc cho bạn thành công." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 5. Xóa công việc
router.delete("/:id", authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;
    const taskId = req.params.id;

    const membership = await getUserRoom(userId);
    if (!membership || membership.role !== "admin") {
      await connection.rollback();
      return res.status(403).json({ message: "Chỉ trưởng phòng mới được xóa" });
    }

    // Xóa tất cả assignments chưa hoàn thành trong tương lai
    await connection.execute(
      "DELETE FROM task_assignments WHERE task_id = ? AND status = 'pending'",
      [taskId]
    );

    // Kiểm tra xem task còn assignment nào không, nếu không thì xóa luôn task gốc
    const [remaining] = await connection.execute(
      "SELECT id FROM task_assignments WHERE task_id = ?",
      [taskId]
    );

    if (remaining.length === 0) {
      await connection.execute("DELETE FROM tasks WHERE id = ?", [taskId]);
    }

    await connection.commit();
    res.json({ message: "Xóa thành công" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});

export default router;
