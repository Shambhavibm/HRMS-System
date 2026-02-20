import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import majorCities from "../../../utils/majorCities";
import Select from "react-select";

const HolidaySettings = () => {
  const [holidays, setHolidays] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [allCities, setAllCities] = useState([]);
  const [newCity, setNewCity] = useState("");
  const [newHoliday, setNewHoliday] = useState({
    name: "",
    date: "",
    locations: [],
    type: "mandatory",
  });

 useEffect(() => {
  fetchHolidays();
  setTimeout(fetchBookings, 300);  // Delay to reduce API burst
  setTimeout(fetchCities, 600);
}, []);

const fetchHolidays = async () => {
  const token = localStorage.getItem("token");

  let role = localStorage.getItem("role");
  if (!role) {
    try {
      // Fallback: decode token to extract role
      const tokenParts = token?.split(".")[1];
      const decoded = tokenParts ? JSON.parse(atob(tokenParts)) : {};
      role = decoded.role || "member";
    } catch {
      role = "member";
    }
  }

  const endpoint =
    role === "admin"
      ? "/api/holidays/admin/all" // ✅ New safe endpoint for admin
      : "/api/holidays/location-based"; // only for member/manager

  try {
    const res = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("🔍 Fetched holidays:", res.data); // <== Add this line
    setHolidays(res.data);
  } catch (err) {
    console.error("❌ Failed to fetch holidays", err);
    alert(err?.response?.data?.message || "Failed to fetch holidays");
  }
};


const fetchBookings = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("/api/holidays/optional-bookings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("✅ Optional Bookings:", res.data);
    setBookings(res.data);
  } catch (err) {
    console.error("❌ Failed to fetch optional bookings", err);
  }
};


  const fetchCities = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/office-locations/cities", {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
      const combined = [...new Set([...majorCities, ...res.data])];
      setAllCities(combined);
    } catch (err) {
      console.error("Failed to fetch cities", err);
    }
  };

  const handleAddCity = async () => {
    const trimmed = newCity.trim();
    if (!trimmed) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/office-locations/add-city",
        { city: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewCity("");
      fetchCities();
    } catch (err) {
      console.error("Error adding city", err);
      alert(err.response?.data?.error || "Failed to add city");
    }
  };

  const addHoliday = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.post("/api/holidays", newHoliday, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Holiday added:", response.data);
      setNewHoliday({ name: "", date: "", locations: [], type: "mandatory" });
      fetchHolidays();
    } catch (error) {
      console.error("Failed to add holiday:", error.response?.data || error.message);
    }
  };

  const filteredBookings = bookings.filter((b) =>
    `${b.employee?.full_name} ${b.employee?.official_email_id} ${b.holiday?.name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-6 bg-white rounded-xl shadow-md relative z-10">
      <h2 className="text-xl font-bold mb-4">📅 Holiday Settings</h2>

      <div className="space-y-4 mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <input
          type="text"
          placeholder="Holiday Name"
          value={newHoliday.name}
          onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
          className="border px-3 py-2 rounded w-full"
        />

        <div className="relative z-10">
          <DatePicker
            selected={newHoliday.date ? new Date(newHoliday.date) : null}
            onChange={(date) =>
              setNewHoliday({ ...newHoliday, date: format(date, "yyyy-MM-dd") })
            }
            dateFormat="yyyy-MM-dd"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            placeholderText="Select date"
            className="border px-3 py-2 rounded w-full bg-white text-gray-900"
          />
        </div>

        <select
          value={newHoliday.type}
          onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value })}
          className="border px-3 py-2 rounded w-full"
        >
          <option value="mandatory">Mandatory</option>
          <option value="optional">Optional</option>
        </select>

        <Select
          isMulti
          options={allCities.map((city) => ({ label: city, value: city }))}
          value={newHoliday.locations.map((loc) => ({ label: loc, value: loc }))}
          onChange={(selectedOptions) =>
            setNewHoliday({
              ...newHoliday,
              locations: selectedOptions.map((opt) => opt.value),
            })
          }
          className="basic-multi-select w-full"
          classNamePrefix="select"
          placeholder="Select Locations"
          styles={{
            control: (base) => ({
              ...base,
              padding: "2px",
              borderColor: "#d1d5db",
              boxShadow: "none",
            }),
          }}
        />

        <div>
          <input
            type="text"
            placeholder="Add new city"
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
          <button
            onClick={handleAddCity}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-2"
          >
            ➕ Add City
          </button>
        </div>

        <button
          onClick={addHoliday}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          ➕ Add Holiday
        </button>
      </div>

      <h3 className="text-lg font-semibold mt-8 mb-2">📋 All Holidays</h3>
      <table className="w-full text-sm border mt-4">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-left">Locations</th>
          </tr>
        </thead>
        <tbody>
          {holidays.map((h) => (
            <tr key={h.id}>
              <td className="p-2">{h.date}</td>
              <td className="p-2">{h.name}</td>
              <td className="p-2 capitalize">{h.type}</td>
              <td className="p-2 flex gap-1 flex-wrap">
  {(() => {
    let locations = h.locations;
    if (typeof locations === "string") {
      try {
        locations = JSON.parse(locations);
      } catch {
        locations = [];
      }
    }

    return Array.isArray(locations) && locations.length > 0
      ? locations.map((loc, idx) => (
          <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
            {loc}
          </span>
        ))
      : <span className="text-gray-400">-</span>;
  })()}
</td>



            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-4">📋 Optional Leave Bookings</h3>

        <input
          type="text"
          placeholder="Search by employee name, email, or holiday"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-4 py-2 rounded mb-4 w-full max-w-sm"
        />

        <table className="w-full border text-sm rounded overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Employee</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Holiday</th>
              <th className="p-2 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((b, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{b.employee?.full_name}</td>
                  <td className="p-2">{b.employee?.official_email_id}</td>
                  <td className="p-2">{b.holiday?.name}</td>
                  <td className="p-2">{b.holiday?.date}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-400">
                  No optional leave bookings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HolidaySettings;
