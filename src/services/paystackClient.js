// src/services/paystackClient.js

// Must use Vite variables, not process.env
const API_ROOT = import.meta.env.VITE_API_ROOT || "https://YOUR_CLOUD_FUNCTIONS_URL";

export async function createPaystackCharge({ bookingId, amount, email }) {
  const resp = await fetch(`${API_ROOT}/create-charge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId, amount, email })
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Failed to create charge: ${txt}`);
  }

  return await resp.json(); // return access_url, auth codes etc
}

export async function getBookingStatus(bookingId) {
  const resp = await fetch(`${API_ROOT}/booking-status?bookingId=${encodeURIComponent(bookingId)}`);
  if (!resp.ok) throw new Error("Failed to get booking status");
  return await resp.json();
}
