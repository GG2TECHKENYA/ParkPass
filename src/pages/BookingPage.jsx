// src/pages/BookingPage.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { createBookingAtomic } from "../services/booking";
import { createPaystackCharge } from "../services/paystackClient";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

export default function BookingPage() {
  const { id: slotIdParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [slot, setSlot] = useState(location.state?.slot || null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slot && slotIdParam) {
      (async () => {
        const snap = await getDoc(doc(db, "parking_slots", slotIdParam));
        if (!snap.exists()) return setError("Slot not found");
        setSlot({ id: snap.id, ...snap.data() });
      })();
    }
  }, [slot, slotIdParam]);

  useEffect(() => {
    if (!start || !end) return;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s) || isNaN(e) || e <= s) {
      setAmount(0);
      return;
    }
    const hours = Math.ceil((e - s) / (1000 * 60 * 60));
    // pricing: use slot.price_per_hour if available
    const rate = slot?.price_per_hour ? Number(slot.price_per_hour) : 1.0;
    setAmount(hours * rate);
  }, [start, end, slot]);

  const handleBook = async () => {
    setError(null);
    if (!slot) return setError("No slot selected");
    if (!start || !end) return setError("Select start and end time");
    const startISO = new Date(start).toISOString();
    const endISO = new Date(end).toISOString();

    setLoading(true);
    try {
      const bId = await createBookingAtomic({
        slotId: slot.id,
        slotName: slot.name || slot.number || slot.id,
        startTimeISO: startISO,
        endTimeISO: endISO,
        amount
      });
      setBookingId(bId);

      const user = auth.currentUser;
      const email = user?.email || "unknown@example.com";
      const payRes = await createPaystackCharge({ bookingId: bId, amount, email });

      // payRes may contain access_url (QR page) or data.qr_code_url depending on Paystack response
      const qr = payRes.data?.qr_code_url || payRes.access_url || payRes.authorization_url || null;
      setQrData({ qr, payRes });

      // navigate to a success/qr page or display inline
      navigate(`/booking-success/${bId}`, { state: { qr, bookingId: bId } });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h2 className="text-2xl font-semibold mb-4">Book {slot?.name || slot?.number || "Slot"}</h2>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="grid grid-cols-1 gap-4">
        <label className="block">
          <span>Start time</span>
          <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
        </label>

        <label className="block">
          <span>End time</span>
          <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
        </label>

        <div>
          <span>Amount</span>
          <div className="mt-1 text-xl font-semibold">${amount.toFixed(2)}</div>
        </div>

        <div>
          <button onClick={handleBook} disabled={loading || amount <= 0} className="px-4 py-2 rounded bg-blue-600 text-white">
            {loading ? "Booking..." : "Proceed to Pay (Generate QR)"}
          </button>
        </div>

        {qrData?.qr && (
          <div className="mt-4">
            <h4 className="font-semibold">Pay using this QR</h4>
            <img src={qrData.qr} alt="Paystack QR" className="mt-2 max-w-xs" />
            <p className="text-sm text-gray-600">Scan to pay. Payment will reflect automatically once Paystack notifies us.</p>
          </div>
        )}
      </div>
    </div>
  );
}
