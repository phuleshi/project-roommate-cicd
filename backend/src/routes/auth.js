import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "secret_key_change_me";

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }

    const [exist] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (exist.length > 0) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      "INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)",
      [email, hash, full_name]
    );

    res.status(201).json({
      message: "Đăng ký thành công",
      userId: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      "SELECT id, email, full_name, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: users[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/me", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, email, current_password, new_password } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ message: "Full name and email are required" });
    }

    const [users] = await db.execute(
      "SELECT id, email, full_name, password, created_at FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentUser = users[0];

    if (email !== currentUser.email) {
      const [existingUsers] = await db.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, userId]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    let passwordHash = currentUser.password;

    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ message: "Current password is required" });
      }

      const isMatch = await bcrypt.compare(current_password, currentUser.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      passwordHash = await bcrypt.hash(new_password, 10);
    }

    await db.execute(
      "UPDATE users SET full_name = ?, email = ?, password = ? WHERE id = ?",
      [full_name, email, passwordHash, userId]
    );

    const updatedUser = {
      id: currentUser.id,
      email,
      full_name,
      created_at: currentUser.created_at,
    };

    const token = jwt.sign(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Profile updated successfully",
      token,
      user: updatedUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
