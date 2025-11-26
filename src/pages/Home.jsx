// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { MapPin, Star, Clock, Car, CheckCircle } from "lucide-react";

const Home = () => {
  const [parkingSlots, setParkingSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingTestData, setAddingTestData] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const parseFeatures = (features) => {
    if (!features) return [];
    
    // Handle array with single string containing quoted features
    if (Array.isArray(features) && features.length === 1 && typeof features[0] === 'string') {
      const featureString = features[0];
      return featureString
        .split(',')
        .map(item => item.trim().replace(/^"|"$/g, ''))
        .filter(item => item.length > 0);
    }
    
    if (Array.isArray(features)) return features;
    
    if (typeof features === "string") {
      return features
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    
    return [];
  };

  const addTestParkingSpots = async () => {
    setAddingTestData(true);
    
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
      
      console.log('Test parking spots added successfully!');
    } catch (error) {
      console.error('Error adding test data:', error);
      alert(`Error adding test data: ${error.message}`);
    } finally {
      setAddingTestData(false);
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "parking_slots"), (snap) => {
      const items = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          features: parseFeatures(data.features),
        };
      });
      console.log("Parking slots fetched:", items);
      setParkingSlots(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching parking slots:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredSlots = parkingSlots.filter(slot =>
    slot.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    slot.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading parking spots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Find Your Perfect Parking Spot
          </h1>
          <p className="text-xl mb-8">
            Book secure, affordable parking spaces in Kenya
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-2 flex">
              <input
                type="text"
                placeholder="Search by location or parking name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 text-gray-800 rounded-l-lg focus:outline-none"
              />
              <button className="bg-blue-700 text-white px-6 py-2 rounded-r-lg hover:bg-blue-800 transition-colors">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Available Parking Spots
          </h2>
          <p className="text-gray-600">
            {filteredSlots.length} of {parkingSlots.length} spots
          </p>
        </div>

        {/* Show Add Test Data button if no spots exist */}
        {parkingSlots.length === 0 && (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Parking Spots Found</h3>
            <p className="text-yellow-700 mb-4">
              Your Firebase database is empty. Add test data to get started.
            </p>
            <button
              onClick={addTestParkingSpots}
              disabled={addingTestData}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              {addingTestData ? 'Adding Test Data...' : 'Add Test Parking Spots'}
            </button>
          </div>
        )}

        {filteredSlots.length === 0 && parkingSlots.length > 0 ? (
          <div className="text-center py-12">
            <Car className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Matching Parking Spots</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search terms</p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSlots.map((slot) => (
              <div key={slot.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={slot.image && slot.image !== "n/a" 
                      ? slot.image 
                      : "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                    }
                    alt={slot.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${
                    slot.status === "available" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {slot.status === "available" ? "Available" : "Unavailable"}
                  </div>
                </div>

                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{slot.name}</h2>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{slot.location}</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-600">
                        {slot.rating} ({slot.reviews} reviews)
                      </span>
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      KES {slot.price}/hour
                    </div>
                  </div>

                  {/* Features */}
                  {slot.features.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {slot.features.map((feature, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {slot.distance} km away
                    </div>
                    <span>{slot.available} spots available</span>
                  </div>

                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;