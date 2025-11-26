import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { BarChart3, Users, ParkingSquare, DollarSign, Loader2, AlertCircle } from "lucide-react";

const AdminDashboard = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const isAdmin = userProfile?.role === "admin" || user?.email === "gg2techkenya@gmail.com";

  const [usersCount, setUsersCount] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [slotsCount, setSlotsCount] = useState(0);
  const [slotsList, setSlotsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [newSpot, setNewSpot] = useState({
    name: "",
    location: "",
    status: "available",
    price: "",
    available: "",
    total: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }

    setLoading(true);

    // Real-time counts
    const unsubUsers = onSnapshot(
      collection(db, "users"), 
      (snap) => {
        setUsersCount(snap.docs.length);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setError("Failed to load user data");
        setLoading(false);
      }
    );

    const unsubBookings = onSnapshot(
      collection(db, "bookings"), 
      (snap) => setBookingsCount(snap.docs.length),
      (err) => console.error("Error fetching bookings:", err)
    );

    const unsubSlots = onSnapshot(
      collection(db, "parking_slots"), 
      (snap) => {
        setSlotsCount(snap.docs.length);
        setSlotsList(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (err) => console.error("Error fetching slots:", err)
    );

    return () => {
      unsubUsers();
      unsubBookings();
      unsubSlots();
    };
  }, [isAdmin, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSpot({ ...newSpot, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert("Please select a valid image file");
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    const storageRef = ref(storage, `parking_images/${Date.now()}_${imageFile.name}`);
    await uploadBytes(storageRef, imageFile);
    return await getDownloadURL(storageRef);
  };

  const handleAddSpot = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate inputs
      if (Number(newSpot.price) <= 0) {
        alert("Price must be greater than 0");
        setSubmitting(false);
        return;
      }

      if (newSpot.total && Number(newSpot.total) <= 0) {
        alert("Total spots must be greater than 0");
        setSubmitting(false);
        return;
      }

      if (newSpot.available && newSpot.total && Number(newSpot.available) > Number(newSpot.total)) {
        alert("Available spots cannot exceed total spots");
        setSubmitting(false);
        return;
      }

      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const spotData = {
        name: newSpot.name.trim(),
        location: newSpot.location.trim(),
        status: newSpot.status,
        price: Number(newSpot.price),
        image: imageUrl || "",
        features: ["Covered", "24/7", "CCTV"],
        rating: 0,
        reviews: 0,
        distance: 0,
        available: newSpot.available ? Number(newSpot.available) : 0,
        total: newSpot.total ? Number(newSpot.total) : 0,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "parking_slots"), spotData);

      alert("Parking spot added successfully!");
      
      // Reset form
      setNewSpot({ 
        name: "", 
        location: "", 
        status: "available", 
        price: "", 
        available: "",
        total: ""
      });
      setImageFile(null);
      setImagePreview(null);

    } catch (err) {
      console.error("Error adding parking spot:", err);
      alert(`Error adding parking spot: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSpot = async (id, imageUrl) => {
    if (!window.confirm("Are you sure you want to delete this parking spot?")) return;

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, "parking_slots", id));

      // Delete image from Storage if it exists
      if (imageUrl && imageUrl.includes('firebase')) {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (imgErr) {
          console.error("Error deleting image:", imgErr);
          // Continue even if image deletion fails
        }
      }

      alert("Parking spot deleted successfully!");
    } catch (err) {
      console.error("Error deleting spot:", err);
      alert(`Error deleting spot: ${err.message}`);
    }
  };

  const revenue = bookingsCount * 100; // example calculation

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Stat icon={Users} label="Total Users" value={usersCount} color="blue" />
        <Stat icon={ParkingSquare} label="Parking Spots" value={slotsCount} color="green" />
        <Stat icon={DollarSign} label="Revenue" value={`$${revenue.toLocaleString()}`} color="purple" />
        <Stat icon={BarChart3} label="Bookings" value={bookingsCount} color="orange" />
      </div>

      {/* ADD NEW PARKING SPOT */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Parking Spot</h2>
        <form onSubmit={handleAddSpot} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spot Name *
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g., Downtown Parking Plaza"
              value={newSpot.name}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              name="location"
              placeholder="e.g., 123 Main Street, Nairobi"
              value={newSpot.location}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (KSH) *
              </label>
              <input
                type="number"
                name="price"
                placeholder="100"
                min="1"
                value={newSpot.price}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                name="status"
                value={newSpot.status}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="booked">Booked</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Spots
              </label>
              <input
                type="number"
                name="available"
                placeholder="10"
                min="0"
                value={newSpot.available}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Spots
              </label>
              <input
                type="number"
                name="total"
                placeholder="20"
                min="0"
                value={newSpot.total}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {imagePreview && (
              <div className="mt-2">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded"
                />
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Spot"
            )}
          </button>
        </form>
      </div>

      {/* PARKING SPOT LIST */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          All Parking Spots ({slotsList.length})
        </h2>
        
        {slotsList.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No parking spots added yet. Add your first spot above!
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slotsList.map((spot) => (
              <div key={spot.id} className="border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <img
                  src={spot.image || "https://via.placeholder.com/400x300?text=No+Image"}
                  alt={spot.name}
                  className="w-full h-40 object-cover rounded mb-3"
                />

                <h3 className="font-semibold text-lg mb-1">{spot.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{spot.location}</p>
                
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    <span className={`px-2 py-1 rounded text-xs ${
                      spot.status === 'available' ? 'bg-green-100 text-green-800' :
                      spot.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {spot.status}
                    </span>
                  </p>
                  <p><span className="font-medium">Price:</span> KSH {spot.price}</p>
                  {spot.total > 0 && (
                    <p>
                      <span className="font-medium">Capacity:</span> {spot.available}/{spot.total}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteSpot(spot.id, spot.image)}
                  className="mt-4 w-full bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;