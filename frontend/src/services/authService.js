const API_URL = import.meta.env.VITE_API_URL;

export async function loginApi(payload) {
  const res = await fetch(`${API_URL}/api/auth/login`, { 
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

export async function registerApi(payload) {
  const res = await fetch(`${API_URL}/api/auth/register`, { // ✅ FIX
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Register failed");
  }

  return data;
}