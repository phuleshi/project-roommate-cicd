import express from "express";
import db from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Helper function: generate random invite code
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// 1. Lấy thông tin phòng hiện tại của user (1 user - 1 room)
router.get("/my-room", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Tìm phòng mà user đang tham gia
    const [memberships] = await db.execute(
      "SELECT room_id, role FROM room_members WHERE user_id = ?",
      [userId]
    );

    if (memberships.length === 0) {
      return res.status(200).json({ room: null });
    }

    const { room_id, role } = memberships[0];

    // Lấy thông tin phòng
    const [rooms] = await db.execute("SELECT * FROM rooms WHERE id = ?", [room_id]);
    if (rooms.length === 0) {
      return res.status(404).json({ message: "Phòng không tồn tại" });
    }
    const room = rooms[0];

    // Lấy danh sách thành viên
    const [members] = await db.execute(
      `SELECT u.id, u.email, u.full_name, rm.role, rm.joined_at 
       FROM room_members rm 
       JOIN users u ON rm.user_id = u.id 
       WHERE rm.room_id = ? 
       ORDER BY rm.role ASC, rm.joined_at ASC`,
      [room_id]
    );

    res.json({
      room: {
        ...room,
        currentUserRole: role,
        members,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. Tạo phòng mới
router.post("/", authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const { name, address } = req.body;

    if (!name) {
      await connection.rollback();
      return res.status(400).json({ message: "Tên phòng là bắt buộc" });
    }

    // Kiểm tra xem user đã có phòng chưa
    const [existing] = await connection.execute(
      "SELECT id FROM room_members WHERE user_id = ?",
      [userId]
    );
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Bạn đã tham gia một phòng khác" });
    }

    const inviteCode = generateInviteCode();

    // Tạo phòng
    const [roomResult] = await connection.execute(
      "INSERT INTO rooms (name, address, invite_code, created_by, members_count, status) VALUES (?, ?, ?, ?, 1, 'active')",
      [name, address || null, inviteCode, userId]
    );
    const roomId = roomResult.insertId;

    // Thêm user vào room_members với quyền admin
    await connection.execute(
      "INSERT INTO room_members (user_id, room_id, role) VALUES (?, ?, 'admin')",
      [userId, roomId]
    );

    await connection.commit();
    res.status(201).json({ message: "Tạo phòng thành công", roomId });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});

// 3. Tham gia phòng bằng mã mời
router.post("/join", authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const { invite_code } = req.body;

    if (!invite_code) {
      await connection.rollback();
      return res.status(400).json({ message: "Cần nhập mã mời" });
    }

    // Kiểm tra xem user đã có phòng chưa
    const [existing] = await connection.execute(
      "SELECT id FROM room_members WHERE user_id = ?",
      [userId]
    );
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Bạn đã tham gia một phòng khác" });
    }

    // Tìm phòng theo mã mời
    const [rooms] = await connection.execute(
      "SELECT id, members_count FROM rooms WHERE invite_code = ? AND status = 'active'",
      [invite_code]
    );
    if (rooms.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Mã mời không hợp lệ hoặc phòng đã bị khóa" });
    }
    const room = rooms[0];

    // Thêm user vào phòng
    await connection.execute(
      "INSERT INTO room_members (user_id, room_id, role) VALUES (?, ?, 'member')",
      [userId, room.id]
    );

    // Cập nhật số lượng thành viên
    await connection.execute(
      "UPDATE rooms SET members_count = members_count + 1 WHERE id = ?",
      [room.id]
    );

    await connection.commit();
    res.json({ message: "Tham gia phòng thành công", roomId: room.id });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});

// 4. Cập nhật thông tin phòng (Chỉ Admin)
router.put("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, address } = req.body;

    // Lấy thông tin phòng của user
    const [memberships] = await db.execute(
      "SELECT room_id, role FROM room_members WHERE user_id = ?",
      [userId]
    );

    if (memberships.length === 0 || memberships[0].role !== "admin") {
      return res.status(403).json({ message: "Chỉ trưởng phòng mới có quyền cập nhật" });
    }

    const roomId = memberships[0].room_id;

    await db.execute(
      "UPDATE rooms SET name = ?, address = ? WHERE id = ?",
      [name, address || null, roomId]
    );

    res.json({ message: "Cập nhật thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 5. Giải thể phòng (Chỉ Admin)
router.delete("/", authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;

    const [memberships] = await connection.execute(
      "SELECT room_id, role FROM room_members WHERE user_id = ?",
      [userId]
    );

    if (memberships.length === 0 || memberships[0].role !== "admin") {
      await connection.rollback();
      return res.status(403).json({ message: "Chỉ trưởng phòng mới có quyền giải thể" });
    }

    const roomId = memberships[0].room_id;

    // Xóa tất cả thành viên trong phòng
    await connection.execute("DELETE FROM room_members WHERE room_id = ?", [roomId]);

    // Xóa phòng
    await connection.execute("DELETE FROM rooms WHERE id = ?", [roomId]);
    // Lưu ý: Nếu có các bảng liên quan (expenses, invoices, tasks), cần CASCADE delete ở DB
    // hoặc xử lý xóa trước ở đây. Tạm thời theo schema đã có.

    await connection.commit();
    res.json({ message: "Giải thể phòng thành công" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});

// 6. Rời khỏi phòng (Member)
router.post("/leave", authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;

    const [memberships] = await connection.execute(
      "SELECT room_id, role FROM room_members WHERE user_id = ?",
      [userId]
    );

    if (memberships.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Bạn chưa tham gia phòng nào" });
    }

    const { room_id, role } = memberships[0];

    // Kiểm tra nếu là admin thì phải chuyển quyền trước khi rời (nếu còn người khác)
    if (role === "admin") {
      const [otherMembers] = await connection.execute(
        "SELECT id FROM room_members WHERE room_id = ? AND user_id != ?",
        [room_id, userId]
      );
      if (otherMembers.length > 0) {
        await connection.rollback();
        return res.status(400).json({ message: "Bạn phải chuyển quyền trưởng phòng cho người khác trước khi rời phòng" });
      } else {
        // Nếu là người duy nhất, giải thể phòng luôn
        await connection.execute("DELETE FROM room_members WHERE room_id = ?", [room_id]);
        await connection.execute("DELETE FROM rooms WHERE id = ?", [room_id]);
        await connection.commit();
        return res.json({ message: "Đã rời và giải thể phòng vì không còn ai" });
      }
    }

    // Xóa user khỏi phòng
    await connection.execute("DELETE FROM room_members WHERE user_id = ?", [userId]);
    // Cập nhật số lượng
    await connection.execute(
      "UPDATE rooms SET members_count = members_count - 1 WHERE id = ?",
      [room_id]
    );

    await connection.commit();
    res.json({ message: "Rời phòng thành công" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});

// 7. Xóa thành viên (Chỉ Admin)
router.delete("/members/:memberId", authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;
    const memberId = req.params.memberId;

    if (userId == memberId) {
      await connection.rollback();
      return res.status(400).json({ message: "Không thể tự xóa chính mình" });
    }

    const [memberships] = await connection.execute(
      "SELECT room_id, role FROM room_members WHERE user_id = ?",
      [userId]
    );

    if (memberships.length === 0 || memberships[0].role !== "admin") {
      await connection.rollback();
      return res.status(403).json({ message: "Chỉ trưởng phòng mới có quyền xóa thành viên" });
    }

    const roomId = memberships[0].room_id;

    // Kiểm tra xem thành viên kia có ở trong phòng không
    const [target] = await connection.execute(
      "SELECT id FROM room_members WHERE user_id = ? AND room_id = ?",
      [memberId, roomId]
    );

    if (target.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Thành viên không thuộc phòng này" });
    }

    // Xóa thành viên
    await connection.execute("DELETE FROM room_members WHERE user_id = ?", [memberId]);
    await connection.execute(
      "UPDATE rooms SET members_count = members_count - 1 WHERE id = ?",
      [roomId]
    );

    await connection.commit();
    res.json({ message: "Xóa thành viên thành công" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});

// 8. Chuyển quyền trưởng phòng
router.put("/transfer-admin", authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      await connection.rollback();
      return res.status(400).json({ message: "Vui lòng chọn người nhận quyền" });
    }

    const [memberships] = await connection.execute(
      "SELECT room_id, role FROM room_members WHERE user_id = ?",
      [userId]
    );

    if (memberships.length === 0 || memberships[0].role !== "admin") {
      await connection.rollback();
      return res.status(403).json({ message: "Chỉ trưởng phòng mới có quyền thực hiện" });
    }

    const roomId = memberships[0].room_id;

    // Kiểm tra người nhận quyền có trong phòng không
    const [target] = await connection.execute(
      "SELECT id FROM room_members WHERE user_id = ? AND room_id = ?",
      [targetUserId, roomId]
    );

    if (target.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Người nhận quyền không thuộc phòng này" });
    }

    // Đổi quyền người hiện tại thành member
    await connection.execute(
      "UPDATE room_members SET role = 'member' WHERE user_id = ?",
      [userId]
    );

    // Đổi quyền người mới thành admin
    await connection.execute(
      "UPDATE room_members SET role = 'admin' WHERE user_id = ?",
      [targetUserId]
    );

    await connection.commit();
    res.json({ message: "Chuyển quyền trưởng phòng thành công" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});

export default router;
