import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const OptionalLeaveBooking = () => {
  const [holidays, setHolidays] = useState([]);
  const [selected, setSelected] = useState([]);

  const fetchHolidays = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/holidays", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const optional = res.data.filter((h) => h.type === "optional");
      setHolidays(optional);
    } catch (err) {
      console.error("❌ Failed to fetch holidays", err);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/users/me/optional-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const alreadySelected = res.data.map((b) => b.holiday_id);
      setSelected(alreadySelected);
    } catch (err) {
      console.warn("No previous selections found.");
    }
  };

  const toggleHoliday = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((h) => h !== id));
    } else {
      if (selected.length >= 2) {
        toast.warning("You can only select up to 2 optional holidays.");
        return;
      }
      setSelected([...selected, id]);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/holidays/book-optional",
        { holiday_ids: selected },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("✅ Optional leaves booked successfully!");
    } catch (err) {
      console.error("Booking failed", err);
      toast.error("Failed to save selections.");
    }
  };

  useEffect(() => {
    fetchHolidays();
    fetchMyBookings();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">🗓️ Choose Your Optional Holidays</h2>
      <p className="text-sm text-gray-500 mb-6">
        You can select <strong>up to 2</strong> optional holidays from the list below.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {holidays.map((h) => (
          <div
            key={h.id}
            onClick={() => toggleHoliday(h.id)}
            className={`cursor-pointer border rounded-lg p-4 shadow-sm ${
              selected.includes(h.id)
                ? "border-blue-600 bg-blue-50"
                : "hover:bg-gray-50"
            }`}
          >
            <div className="font-semibold text-gray-800">{h.name}</div>
            <div className="text-sm text-gray-500">{h.date}</div>
            <div className="text-xs text-gray-400 mt-1">
              {Array.isArray(h.locations) ? h.locations.join(", ") : ""}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-right">
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Save Selection
        </button>
      </div>
    </div>
  );
};

export default OptionalLeaveBooking;
