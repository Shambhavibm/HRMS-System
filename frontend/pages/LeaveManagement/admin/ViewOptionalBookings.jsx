import React, { useEffect, useState } from "react";
import axios from "axios";

const ViewOptionalBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/holidays/optional-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(res.data);
    } catch (err) {
      console.error("❌ Failed to load optional bookings", err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filtered = bookings.filter((b) =>
    `${b.employee?.full_name} ${b.employee?.official_email_id} ${b.holiday?.name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">📋 Optional Holiday Bookings</h2>
      <input
        type="text"
        placeholder="Search by name, email, or holiday..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-4 py-2 rounded mb-4 w-full"
      />

      <table className="w-full border text-sm shadow rounded overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Employee</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Holiday</th>
            <th className="p-2 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length > 0 ? (
            filtered.map((b, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2">{b.employee?.full_name}</td>
                <td className="p-2">{b.employee?.official_email_id}</td>
                <td className="p-2">{b.holiday?.name}</td>
                <td className="p-2">{b.holiday?.date}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="p-4 text-center text-gray-500">
                No bookings found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ViewOptionalBookings;
