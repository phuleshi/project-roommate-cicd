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

export async function getTasks(startDate, endDate) {
  let url = `${API_URL}/api/tasks`;
  if (startDate && endDate) {
    url += `?start_date=${startDate}&end_date=${endDate}`;
  }

  const res = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });
  const data = await parseResponse(res, "Failed to fetch tasks");
  return data.assignments;
}

export async function createTask(payload) {
  const res = await fetch(`${API_URL}/api/tasks`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(res, "Failed to create task");
}

export async function toggleTaskDone(assignmentId, note = "") {
  const res = await fetch(`${API_URL}/api/tasks/assignments/${assignmentId}/done`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ note }),
  });
  return parseResponse(res, "Failed to update task");
}

export async function transferTask(assignmentId) {
  const res = await fetch(`${API_URL}/api/tasks/assignments/${assignmentId}/transfer`, {
    method: "PUT",
    headers: getHeaders(),
  });
  return parseResponse(res, "Failed to transfer task");
}

export async function deleteTask(taskId) {
  const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return parseResponse(res, "Failed to delete task");
}
