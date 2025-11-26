// src/components/SpotCard.jsx
import React from "react";

const statusBadge = (status) => {
  if (status === "available") return "bg-green-100 text-green-700";
  if (status === "reserved") return "bg-yellow-100 text-yellow-800";
  if (status === "booked") return "bg-red-100 text-red-700";
  return "bg-gray-100";
};

export default function SpotCard({ slot, onSelect }) {
  if (!slot) return null;

  return (
    <div className="border rounded-lg p-4 shadow-sm flex justify-between items-center">
      <div>
        <h3 className="font-semibold text-lg">{slot.name || slot.number || slot.id}</h3>
        <p className="text-sm text-gray-600">{slot.location || "Main Lot"}</p>
        <p className="text-sm text-gray-600">Price: ${slot.price || 0}</p>
      </div>

      <div className="flex items-center space-x-4">
        <span className={`px-3 py-1 rounded-full text-sm ${statusBadge(slot.status)}`}>
          {slot.status || "unknown"}
        </span>

        <button
          disabled={slot.status !== "available"}
          onClick={() => onSelect && onSelect(slot)}
          className={`px-3 py-1 rounded-md text-sm font-semibold ${
            slot.status === "available"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Select
        </button>
      </div>
    </div>
  );
}
