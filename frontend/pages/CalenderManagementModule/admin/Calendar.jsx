import React, { useState, useEffect } from "react";
import axios from "axios";
import CalendarMain from "../../../components/CalendarMain";
import Sidebar from "../../../components/Sidebar";
import EventModal from "../../../components/EventModal";
import BulkUploadModal from "../../../components/BulkUploadModal";

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const [filters, setFilters] = useState({
    type: "",
    scope: "",
    start_date: null,
    end_date: null,
  });

  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);

  const fetchHolidays = async () => {
    try {
      const token = localStorage.getItem("token");
      const endpoint =
        role === "admin"
          ? "/api/holidays/admin/all"
          : "/api/holidays/location-based";

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const mandatory = res.data
        .filter((h) => h.type === "mandatory")
        .map((h) => ({
          title: `Mandatory: ${h.name}`,
          date: h.date,
          type: "mandatory_holiday",
          backgroundColor: "#fde68a",
          borderColor: "#facc15",
          textColor: "#92400e",
        }));

      const optional = res.data
        .filter((h) => h.type === "optional")
        .map((h) => ({
          title: `Optional: ${h.name}`,
          date: h.date,
          type: "optional_holiday",
          backgroundColor: "#dbeafe",
          borderColor: "#3b82f6",
          textColor: "#1e3a8a",
        }));

      setHolidays([...mandatory, ...optional]);
    } catch (err) {
      console.error("Failed to fetch holidays:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setUserId(decoded.userId);
        setRole(decoded.role);
      } catch (err) {
        console.error("Failed to decode token:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (role) {
      fetchEvents();
      fetchTeams();
      fetchUsers();
      fetchHolidays(); // now works since it's defined outside
    }
  }, [role]);

  const fetchEvents = async () => {
    try {
      const res = await axios.get("/api/calendar-events/visible");
      setEvents(res.data);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  const fetchTeams = async () => {
    try {
      const endpoint =
        role === "manager" ? "/api/admin/teams/my-teams" : "/api/admin/teams";
      const res = await axios.get(endpoint);
      const formattedTeams = res.data.map((team) => ({
        value: team.id,
        label: team.name,
      }));
      setTeams(formattedTeams);
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  useEffect(() => {
    const filtered = events.filter((e) => {
      const matchType = filters.type ? e.type === filters.type : true;
      const matchScope = filters.scope ? e.scope === filters.scope : true;

      const startDate = filters.start_date ? new Date(filters.start_date) : null;
      const endDate = filters.end_date ? new Date(filters.end_date) : null;

      const eventStart = new Date(e.start_date);
      const eventEnd = new Date(e.end_date);

      const matchStart = startDate ? eventEnd >= startDate : true;
      const matchEnd = endDate ? eventStart <= endDate : true;

      return matchType && matchScope && matchStart && matchEnd;
    });

    setFilteredEvents(filtered);
  }, [events, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleEventSave = async (newEvent) => {
    try {
      await axios.post("/api/calendar-events/create", newEvent);
      fetchEvents();
      setShowModal(false);
    } catch (err) {
      console.error("Failed to save event", err);
    }
  };

  const allCalendarItems = [...filteredEvents, ...holidays];

  return (
    <div className="flex">
      <Sidebar
        onAddClick={() => setShowModal(true)}
        onBulkUploadClick={() => setShowBulkModal(true)}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      <CalendarMain
        events={allCalendarItems}
        onDateClick={setSelectedDate}
      />

      {showModal && (
        <EventModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleEventSave}
          user_id={userId}
          teams={teams}
          users={users}
          selectedDate={selectedDate}
        />
      )}

      {showBulkModal && (
        <BulkUploadModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          onUploaded={fetchEvents}
        />
      )}
    </div>
  );
};

export default Calendar;
