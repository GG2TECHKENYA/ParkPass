// src/components/AddTestData.jsx
import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const AddTestData = () => {
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');

  const addTestParkingSpots = async () => {
    setAdding(true);
    setMessage('');
    
    try {
      const testSpots = [
        {
          name: "Ruiru Town Parking",
          location: "Ruiru, Kenya",
          status: "available",
          price: 10,
          available: 15,
          total: 30,
          distance: 1,
          features: ['"Covered", "24/7", "CCTV"'],
          image: "n/a",
          rating: 4.8,
          reviews: 10,
          createdAt: serverTimestamp()
        },
        {
          name: "Nairobi CBD Parking",
          location: "Nairobi Central, Kenya",
          status: "available",
          price: 15,
          available: 8,
          total: 20,
          distance: 0.5,
          features: ['"Secure", "Lighted", "Attended"'],
          image: "n/a",
          rating: 4.5,
          reviews: 25,
          createdAt: serverTimestamp()
        },
        {
          name: "Westlands Parking Plaza",
          location: "Westlands, Nairobi, Kenya",
          status: "available",
          price: 12,
          available: 12,
          total: 25,
          distance: 2.3,
          features: ['"Covered", "CCTV", "Easy Access"'],
          image: "n/a",
          rating: 4.7,
          reviews: 18,
          createdAt: serverTimestamp()
        }
      ];

      const promises = testSpots.map(spot => addDoc(collection(db, 'parking_slots'), spot));
      await Promise.all(promises);
      
      setMessage('✅ Test parking spots added successfully!');
    } catch (error) {
      console.error('Error adding test data:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Parking Spots Found</h3>
      <p className="text-yellow-700 mb-4">
        Your Firebase database is empty. Add test data to get started.
      </p>
      <button
        onClick={addTestParkingSpots}
        disabled={adding}
        className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
      >
        {adding ? 'Adding...' : 'Add Test Parking Spots'}
      </button>
      {message && (
        <p className={`mt-3 ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default AddTestData;