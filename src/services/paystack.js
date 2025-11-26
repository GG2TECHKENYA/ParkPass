export async function generatePaystackQR(amount, bookingId) {
  const response = await fetch("https://api.paystack.co/charge", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.REACT_APP_PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amount * 100,
      email: "placeholder@customer.com",
      metadata: { bookingId },
      channels: ["qr"],
    }),
  });

  const data = await response.json();
  return data.data.qr_code_url;
}
