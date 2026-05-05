import { translateApiMessage } from "../i18n/translations";

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

async function parseResponse(res, fallbackMessage) {
  const data = await res.json();

  if (!res.ok) {
    throw new Error(translateApiMessage(data.message || fallbackMessage));
  }

  return data;
}

export async function loginApi(payload) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse(res, "Login failed");
}

export async function registerApi(payload) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse(res, "Register failed");
}

export async function getProfileApi() {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return parseResponse(res, "Failed to fetch profile");
}

export async function updateProfileApi(payload) {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse(res, "Failed to update profile");
}
