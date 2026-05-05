import { translateApiMessage } from "../i18n/translations";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export async function getReportOverview() {
  const res = await fetch(`${API_URL}/api/reports/overview`, {
    method: "GET",
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(translateApiMessage(data.message || "Failed to fetch report overview"));
  }
  return data;
}
