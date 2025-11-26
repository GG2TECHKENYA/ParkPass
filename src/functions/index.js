// src/functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const fetch = require("node-fetch");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(express.json());

const PAYSTACK_SECRET = functions.config().paystack?.secret || process.env.PAYSTACK_SECRET;

// Create Paystack charge (initialize transaction with QR channel)
app.post("/create-charge", async (req, res) => {
  try {
    const { bookingId, amount, email } = req.body;
    if (!bookingId || !amount) return res.status(400).send("bookingId and amount required");

    const body = {
      amount: Math.round(amount * 100),
      email: email || "unknown@client.com",
      metadata: { bookingId },
      channels: ["qr"]
    };

    const resp = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json();

    if (!data || !data.status) {
      console.error("Paystack init failed", data);
      return res.status(500).json({ error: "Paystack initialization failed", detail: data });
    }

    const { reference, authorization_url, access_url } = data.data;

    // update booking with paystack init
    await db.collection("bookings").doc(bookingId).update({
      paystackRef: reference,
      paystackInit: data.data,
      paymentStatus: "pending",
      initializedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({
      reference,
      authorization_url,
      access_url,
      data: data.data
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Paystack webhook (configure this URL in Paystack dashboard)
app.post("/webhook", async (req, res) => {
  try {
    const event = req.body;

    // For production verify x-paystack-signature header using PAYSTACK_SECRET

    if (event.event === "charge.success" || event.event === "payment.captured") {
      const bookingId = event.data.metadata?.bookingId;
      if (bookingId) {
        const bookingRef = db.collection("bookings").doc(bookingId);
        const bookingSnap = await bookingRef.get();

        if (bookingSnap.exists) {
          await bookingRef.update({
            paymentStatus: "paid",
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            paystackWebhook: event.data
          });

          const slotId = bookingSnap.data().slotId;
          if (slotId) {
            await db.collection("parking_slots").doc(slotId).update({
              status: "booked",
              currentBookingId: bookingId,
              reservedUntil: null
            });
          }
        }
      }
    }

    if (event.event === "charge.failed" || event.event === "transaction.failed") {
      const bookingId = event.data?.metadata?.bookingId;
      if (bookingId) {
        const bookingRef = db.collection("bookings").doc(bookingId);
        const bookingSnap = await bookingRef.get();
        if (bookingSnap.exists) {
          await bookingRef.update({
            paymentStatus: "failed",
            paystackWebhook: event.data
          });

          const slotId = bookingSnap.data().slotId;
          if (slotId) {
            await db.collection("parking_slots").doc(slotId).update({
              status: "available",
              currentBookingId: null,
              reservedUntil: null
            });
          }
        }
      }
    }

    return res.status(200).send("ok");
  } catch (err) {
    console.error("Webhook error", err);
    return res.status(500).send("error");
  }
});

// status endpoint
app.get("/booking-status", async (req, res) => {
  try {
    const bookingId = req.query.bookingId;
    if (!bookingId) return res.status(400).send("bookingId required");
    const snap = await db.collection("bookings").doc(bookingId).get();
    if (!snap.exists) return res.status(404).send("not found");
    return res.json(snap.data());
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message);
  }
});

exports.api = functions.https.onRequest(app);

// Optional scheduled function for cleaning pending expired bookings (deploy if desired)
exports.cleanupPending = functions.pubsub.schedule('every 5 minutes').onRun(async () => {
  const now = admin.firestore.Timestamp.now();
  const q = db.collection("bookings").where("paymentStatus", "==", "pending").where("reservedUntil", "<=", now);
  const snap = await q.get();
  const batch = db.batch();
  for (const docSnap of snap.docs) {
    const booking = docSnap.data();
    const slotId = booking.slotId;
    batch.update(docSnap.ref, { paymentStatus: "expired", expiredAt: admin.firestore.FieldValue.serverTimestamp() });
    if (slotId) {
      const slotRef = db.collection("parking_slots").doc(slotId);
      batch.update(slotRef, { status: "available", currentBookingId: null, reservedUntil: null });
    }
  }
  await batch.commit();
  console.log(`Cleaned ${snap.size} pending bookings`);
});
