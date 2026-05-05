import { translateApiMessage } from "../i18n/translations";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

async function parseResponse(res, fallbackMessage) {
  const data = await res.json();
  if (!res.ok) throw new Error(translateApiMessage(data.message || fallbackMessage));
  return data;
}

export async function getMyRoom() {
  const res = await fetch(`${API_URL}/api/rooms/my-room`, {
    method: "GET",
    headers: getHeaders(),
  });
  const data = await parseResponse(res, "Failed to fetch room");
  return data.room;
}

export async function createRoom(payload) {
  const res = await fetch(`${API_URL}/api/rooms`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(res, "Failed to create room");
}

export async function joinRoom(invite_code) {
  const res = await fetch(`${API_URL}/api/rooms/join`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ invite_code }),
  });
  return parseResponse(res, "Failed to join room");
}

export async function updateRoom(payload) {
  const res = await fetch(`${API_URL}/api/rooms`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(res, "Failed to update room");
}

export async function disbandRoom() {
  const res = await fetch(`${API_URL}/api/rooms`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return parseResponse(res, "Failed to disband room");
}

export async function leaveRoom() {
  const res = await fetch(`${API_URL}/api/rooms/leave`, {
    method: "POST",
    headers: getHeaders(),
  });
  return parseResponse(res, "Failed to leave room");
}

export async function kickMember(memberId) {
  const res = await fetch(`${API_URL}/api/rooms/members/${memberId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return parseResponse(res, "Failed to kick member");
}

export async function transferAdmin(targetUserId) {
  const res = await fetch(`${API_URL}/api/rooms/transfer-admin`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ targetUserId }),
  });
  return parseResponse(res, "Failed to transfer admin");
}
