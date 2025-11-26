// src/pages/SlotsPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SpotCard from "../components/SpotCard";
import { watchSlots } from "../services/booking";

export default function SlotsPage() {
  const [slots, setSlots] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = watchSlots(setSlots);
    return () => unsub();
  }, []);

  const handleSelect = (slot) => {
    navigate(`/book/${slot.id}`, { state: { slot } });
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h2 className="text-2xl font-semibold mb-6">Available Parking Slots</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {slots.map(s => <SpotCard key={s.id} slot={s} onSelect={handleSelect} />)}
      </div>
    </div>
  );
}
