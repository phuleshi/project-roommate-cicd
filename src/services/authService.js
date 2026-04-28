const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const AUTH_API = `${BASE_URL}/api/auth`;

// DEBUG (xem có đọc được env không)
console.log("API URL:", BASE_URL);

export async function loginApi(payload) {
  try {
    const res = await fetch(`${AUTH_API}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    return data;
  } catch (err) {
    console.error("Login error:", err);
    throw err;
  }
}

export async function registerApi(payload) {
  try {
    const res = await fetch(`${AUTH_API}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Register failed");
    }

    return data;
  } catch (err) {
    console.error("Register error:", err);
    throw err;
  }
}