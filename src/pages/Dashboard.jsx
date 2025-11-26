// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, Clock, Car, Calendar, History, CheckCircle } from "lucide-react";

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [parkingSlots, setParkingSlots] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("available");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const unsubscribeSlots = onSnapshot(
      collection(db, "parking_slots"),
      (snapshot) => {
        const slots = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log("Dashboard - Fetched parking slots:", slots);
        setParkingSlots(slots);
      },
      (error) => {
        console.error("Error fetching parking slots:", error);
        setError("Failed to load parking spots");
      }
    );

    const unsubscribeBookings = onSnapshot(
      collection(db, "bookings"),
      (snapshot) => {
        const allBookings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const userBookings = allBookings.filter(booking => booking.userId === user.uid);
        console.log("Dashboard - User bookings:", userBookings);
        setUserBookings(userBookings);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Error fetching bookings:", error);
        setError("Failed to load bookings");
        setLoading(false);
      }
    );

    return () => {
      unsubscribeSlots();
      unsubscribeBookings();
    };
  }, [user, navigate]);

  // Fixed parseFeatures function for your specific data format
  const parseFeatures = (features) => {
    if (!features) return [];
    
    console.log("Raw features:", features);
    
    // If it's an array with one string element containing quoted features
    if (Array.isArray(features) && features.length === 1 && typeof features[0] === 'string') {
      const featureString = features[0];
      console.log("Processing feature string:", featureString);
      
      // Handle format: '"Covered", "24/7", "CCTV"'
      try {
        // Clean the string and parse as CSV
        const cleaned = featureString
          .split(',') // Split by commas
          .map(item => item.trim().replace(/^"|"$/g, '')) // Remove quotes and trim each item
          .filter(item => item.length > 0); // Remove empty items
        
        console.log("Cleaned features:", cleaned);
        return cleaned;
      } catch (e) {
        console.error("Error processing features:", e);
        return [];
      }
    }
    
    // If it's already a proper array of strings, return as is
    if (Array.isArray(features) && features.every(item => typeof item === 'string')) {
      return features;
    }
    
    return [];
  };

  const handleBookNow = (slotId) => {
    navigate(`/booking/${slotId}`);
  };

  const availableSlots = parkingSlots.filter(slot => slot.status === "available");
  const reservedSlots = parkingSlots.filter(slot => slot.status === "reserved");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 text-red-500 mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userProfile?.name || user?.displayName || "User"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Find and book your perfect parking spot in Kenya
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Spots</p>
              <p className="text-2xl font-semibold text-gray-900">{parkingSlots.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Available Now</p>
              <p className="text-2xl font-semibold text-gray-900">{availableSlots.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <History className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Your Bookings</p>
              <p className="text-2xl font-semibold text-gray-900">{userBookings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("available")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "available"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Available Parking ({availableSlots.length})
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "bookings"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              My Bookings ({userBookings.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "available" && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Available Parking Spots</h2>
              {availableSlots.length === 0 ? (
                <div className="text-center py-12">
                  <Car className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No Available Parking Spots</h3>
                  <p className="text-gray-500 mt-2">
                    All parking spots are currently booked. Check back later for availability.
                  </p>
                  <button
                    onClick={() => navigate("/")}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse All Spots
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableSlots.map((slot) => {
                    const features = parseFeatures(slot.features);
                    const availableSpots = slot.available || 15;
                    
                    return (
                      <div key={slot.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="relative">
                          <img
                            src={slot.image && slot.image !== "n/a" 
                              ? slot.image 
                              : "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                            }
                            alt={slot.name}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            {availableSpots} Available
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2">{slot.name}</h3>
                          <div className="flex items-center text-gray-600 mb-2">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span className="text-sm">{slot.location}</span>
                          </div>
                          
                          <div className="flex items-center justify-between mb-3">
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
                          {features.length > 0 && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-1">
                                {features.slice(0, 3).map((feature, index) => (
                                  <span 
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {feature}
                                  </span>
                                ))}
                                {features.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                    +{features.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {slot.distance} km away
                            </span>
                            <span>Total: {slot.total} spots</span>
                          </div>
                          
                          <button
                            onClick={() => handleBookNow(slot.id)}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "bookings" && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Your Booking History</h2>
              {userBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No Bookings Yet</h3>
                  <p className="text-gray-500 mt-2">Book your first parking spot to see it here</p>
                  <button
                    onClick={() => navigate("/")}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Find Parking
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userBookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {booking.parkingSpotName || "Parking Spot"}
                            </h3>
                            <p className="text-gray-600 mt-1">{booking.location || "Location not specified"}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {booking.startTime} - {booking.endTime}
                              </span>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            booking.status === "confirmed" 
                              ? "bg-green-100 text-green-800"
                              : booking.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || "Unknown"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-6">
                        <p className="text-xl font-bold text-blue-600">KES {booking.totalPrice || "0"}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {booking.createdAt?.toDate ? 
                            new Date(booking.createdAt.toDate()).toLocaleDateString('en-KE', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 
                            "Date not available"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {parkingSlots.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Parking Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{parkingSlots.length}</p>
              <p className="text-sm text-gray-600">Total Spots</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{availableSlots.length}</p>
              <p className="text-sm text-gray-600">Available Now</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{reservedSlots.length}</p>
              <p className="text-sm text-gray-600">Reserved</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{userBookings.length}</p>
              <p className="text-sm text-gray-600">Your Bookings</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;