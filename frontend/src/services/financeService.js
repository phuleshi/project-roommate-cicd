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

export async function getExpenses(month, year) {
  const res = await fetch(`${API_URL}/api/expenses?month=${month}&year=${year}`, {
    method: "GET",
    headers: getHeaders(),
  });
  const data = await parseResponse(res, "Failed to fetch expenses");
  return data.expenses;
}

export async function createExpense(payload) {
  const res = await fetch(`${API_URL}/api/expenses`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(res, "Failed to create expense");
}

export async function deleteExpense(expenseId) {
  const res = await fetch(`${API_URL}/api/expenses/${expenseId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return parseResponse(res, "Failed to delete expense");
}

export async function getInvoices() {
  const res = await fetch(`${API_URL}/api/invoices`, {
    method: "GET",
    headers: getHeaders(),
  });
  const data = await parseResponse(res, "Failed to fetch invoices");
  return data.invoices;
}

export async function getInvoiceDetails(invoiceId) {
  const res = await fetch(`${API_URL}/api/invoices/${invoiceId}`, {
    method: "GET",
    headers: getHeaders(),
  });
  return parseResponse(res, "Failed to fetch invoice details");
}

export async function createInvoice(month, year) {
  const res = await fetch(`${API_URL}/api/invoices`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ month, year }),
  });
  return parseResponse(res, "Failed to create invoice");
}

export async function payInvoice(invoiceId) {
  const res = await fetch(`${API_URL}/api/invoices/${invoiceId}/pay`, {
    method: "POST",
    headers: getHeaders(),
  });
  return parseResponse(res, "Failed to pay invoice");
}

export async function confirmPayment(invoiceId, userId) {
  const res = await fetch(`${API_URL}/api/invoices/${invoiceId}/confirm/${userId}`, {
    method: "POST",
    headers: getHeaders(),
  });
  return parseResponse(res, "Failed to confirm payment");
}
