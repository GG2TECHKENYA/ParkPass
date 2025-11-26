// src/services/booking.js
import { db, auth } from "../firebase";
import {
  doc,
  collection,
  addDoc,
  runTransaction,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  getDoc
} from "firebase/firestore";

/**
 * Watch all parking slots in real time
 */
export function watchSlots(callback) {
  const q = collection(db, "parking_slots");
  return onSnapshot(q, (snap) => {
    const slots = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(slots);
  });
}

/**
 * Atomic booking:
 * - Ensure slot is available
 * - Create booking doc (paymentStatus: 'pending')
 * - Mark slot as 'reserved' and set reservedUntil
 */
export async function createBookingAtomic({ slotId, slotName, startTimeISO, endTimeISO, amount }) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const slotRef = doc(db, "parking_slots", slotId);
  const bookingsRef = collection(db, "bookings");

  const bookingId = await runTransaction(db, async (tx) => {
    const slotSnap = await tx.get(slotRef);
    if (!slotSnap.exists()) throw new Error("Slot not found");
    const slot = slotSnap.data();

    // If slot status is 'available' proceed; otherwise throw
    if (slot.status === "booked" || slot.status === "reserved") {
      throw new Error("Slot not available");
    }

    const bookingDocRef = doc(bookingsRef); // new auto-id
    const bookingData = {
      userId: user.uid,
      userEmail: user.email || null,
      slotId,
      slotName,
      startTime: startTimeISO,
      endTime: endTimeISO,
      amount,
      paymentStatus: "pending",
      paystackRef: null,
      createdAt: serverTimestamp(),
      reservedUntil: endTimeISO
    };

    tx.set(bookingDocRef, bookingData);

    tx.update(slotRef, {
      status: "reserved",
      currentBookingId: bookingDocRef.id,
      reservedUntil: endTimeISO
    });

    return bookingDocRef.id;
  });

  return bookingId;
}

/**
 * Watch bookings for a user in real-time
 */
export function watchUserBookings(userId, callback) {
  const q = query(collection(db, "bookings"), where("userId", "==", userId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(bookings);
  });
}

/**
 * Admin: watch all bookings
 */
export function watchAllBookings(callback) {
  const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

/**
 * Release slot helper
 */
export async function releaseSlot(slotId) {
  const slotRef = doc(db, "parking_slots", slotId);
  await updateDoc(slotRef, {
    status: "available",
    currentBookingId: null,
    reservedUntil: null
  });
}
