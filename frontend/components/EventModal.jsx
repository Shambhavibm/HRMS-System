import { useEffect, useState, useMemo, useCallback } from "react";
import { useModal } from "../hooks/useModal";
import { Modal } from "./ui/modal";
import Button from "./ui/button/Button";
import Input from "./form/input/Input";
import Label from "./form/Label";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

const adminTypeOptions = [
  { value: "Holiday", label: "Holiday" },
  { value: "Announcement", label: "Announcement" },
];
const managerTypeOptions = [
  { value: "Meeting", label: "Meeting" },
  { value: "Team Lunch", label: "Team Lunch" },
  { value: "Announcement", label: "Announcement" },
  { value: "Holiday", label: "Holiday" },
];
const employeeTypeOptions = [
  { value: "Meeting", label: "Meeting" },
  { value: "Team Lunch", label: "Team Lunch" },
  { value: "Announcement", label: "Announcement" },
];

const eventRequiredFields = ["title", "start_date", "end_date", "type", "scope"];
const fieldDisplayNameMap = {
  title: "Title",
  start_date: "Start Date",
  end_date: "End Date",
  type: "Event Type",
  scope: "Event Scope",
  team_id: "Team",
  target_user_id: "Target User",
};

export default function EventModal({
  isOpen: propIsOpen,
  onClose: propOnClose,
  onSave,
  user_id,
  teams = [],
  users = [],
  selectedDate,
}) {
  const { closeModal } = useModal();

  const token = localStorage.getItem("token");
  const decodedToken = token ? JSON.parse(window.atob(token.split(".")[1])) : null;
  const role = decodedToken?.role;

  const [form, setForm] = useState({
    title: "",
    description: "",
    start_date: selectedDate || null,
    end_date: selectedDate || null,
    type: "",
    scope: role === "admin" ? "organization" : "private",
    team_id: "",
    target_user_id: "",
  });

  const [localErrors, setLocalErrors] = useState({});

  const filteredTargetUsers = useMemo(() => {
    if (!Array.isArray(users) || users.length === 0) return [];
    if (role === "manager") {
      if (form.scope === "private") {
        return users.filter((user) => user.manager_id === user_id);
      } else if (form.scope === "team" && form.team_id) {
        return users.filter((user) => user.team_id === parseInt(form.team_id));
      }
    }
    return [];
  }, [role, form.scope, form.team_id, user_id, users]);

  useEffect(() => {
    if (!propIsOpen) {
      setForm({
        title: "",
        description: "",
        start_date: null,
        end_date: null,
        type: "",
        scope: role === "admin" ? "organization" : "private",
        team_id: "",
        target_user_id: "",
      });
      setLocalErrors({});
    } else {
      setForm((prev) => ({
        ...prev,
        start_date: selectedDate,
        end_date: selectedDate,
        type: "",
        scope: role === "admin" ? "organization" : role === "manager" ? prev.scope : "private",
        target_user_id: role === "employee" ? String(user_id) : prev.target_user_id,
      }));
    }
  }, [propIsOpen, role, user_id, selectedDate]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (localErrors[name]) {
      setLocalErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }, [localErrors]);

  const handleScopeChange = (e) => {
    const { value } = e.target;
    setForm((prev) => ({
      ...prev,
      scope: value,
      team_id: "",
      target_user_id: "",
      type: "",
    }));
    setLocalErrors((prev) => ({
      ...prev,
      scope: undefined,
      team_id: undefined,
      target_user_id: undefined,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    eventRequiredFields.forEach((field) => {
      if (!form[field]) {
        newErrors[field] = `${fieldDisplayNameMap[field] || field} is required.`;
        isValid = false;
      }
    });

    if (form.scope === "team" && role === "manager" && !form.team_id) {
      newErrors.team_id = "Please select a team.";
      isValid = false;
    }

    if (form.scope === "private" && role === "manager" && !form.target_user_id) {
      newErrors.target_user_id = "Please select a user.";
      isValid = false;
    }

    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      newErrors.end_date = "End date cannot be before start date.";
      isValid = false;
    }

    setLocalErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    const adjustedEndDate = form.end_date ? new Date(form.end_date) : null;
    if (adjustedEndDate) {
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
    }

    const formatDate = (date) =>
      date
        ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date
            .getDate()
            .toString()
            .padStart(2, "0")}`
        : null;

    const payload = {
      ...form,
      start_date: formatDate(form.start_date),
      end_date: formatDate(adjustedEndDate),
      team_id: form.scope === "team" ? parseInt(form.team_id) : null,
      target_user_id: form.scope === "private" ? parseInt(form.target_user_id) : null,
    };

    try {
      await onSave(payload);
      toast.success("Event created successfully!");
      propOnClose();
    } catch (err) {
      console.error("Error creating event:", err);
      toast.error(`Failed to create event: ${err.message || "An error occurred."}`);
    }
  };

  const availableScopes = useMemo(() => {
    if (role === "admin") return [{ value: "organization", label: "Organization" }];
    if (role === "manager")
      return [
        { value: "private", label: "Private" },
        { value: "team", label: "Team" },
      ];
    return [{ value: "private", label: "Private" }];
  }, [role]);

  const getTypeOptions = useMemo(() => {
    if (role === "admin") return [{ value: "", label: "-- Select Type --" }, ...adminTypeOptions];
    if (role === "manager") return [{ value: "", label: "-- Select Type --" }, ...managerTypeOptions];
    return [{ value: "", label: "-- Select Type --" }, ...employeeTypeOptions];
  }, [role]);

  const currentUser = useMemo(() => {
    return Array.isArray(users) ? users.find((u) => u.user_id === user_id) : undefined;
  }, [users, user_id]);

  const displayUserName = currentUser
    ? `${currentUser.first_name} ${currentUser.last_name}`
    : "My Self";

  return (
    <Modal isOpen={propIsOpen} onClose={propOnClose} className="max-w-[700px] m-4">
      <div className="bg-white dark:bg-gray-900 p-4 lg:p-10 rounded-3xl">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-2">Add New Event</h4>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" value={form.title} onChange={handleChange} />
              {localErrors.title && <p className="text-red-500 text-xs mt-1">{localErrors.title}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div>
              <Label htmlFor="start_date">Start Date *</Label>
              <ReactDatePicker
                selected={form.start_date}
                onChange={(date) => setForm((prev) => ({ ...prev, start_date: date }))}
                dateFormat="dd/MM/yyyy"
                className="w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-900 dark:text-white"
              />
              {localErrors.start_date && <p className="text-red-500 text-xs mt-1">{localErrors.start_date}</p>}
            </div>

            <div>
              <Label htmlFor="end_date">End Date *</Label>
              <ReactDatePicker
                selected={form.end_date}
                onChange={(date) => setForm((prev) => ({ ...prev, end_date: date }))}
                dateFormat="dd/MM/yyyy"
                className="w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-900 dark:text-white"
              />
              {localErrors.end_date && <p className="text-red-500 text-xs mt-1">{localErrors.end_date}</p>}
            </div>

            <div>
              <Label htmlFor="type">Event Type *</Label>
              <select
                id="type"
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-900 dark:text-white"
              >
                {getTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {localErrors.type && <p className="text-red-500 text-xs mt-1">{localErrors.type}</p>}
            </div>

            <div>
              <Label htmlFor="scope">Scope *</Label>
              <select
                id="scope"
                name="scope"
                value={form.scope}
                onChange={handleScopeChange}
                disabled={role === "admin" || role === "employee"}
                className="w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-900 dark:text-white"
              >
                {availableScopes.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {localErrors.scope && <p className="text-red-500 text-xs mt-1">{localErrors.scope}</p>}
            </div>

            {form.scope === "team" && role === "manager" && (
              <div>
                <Label htmlFor="team_id">Team *</Label>
                <select
                  id="team_id"
                  name="team_id"
                  value={form.team_id}
                  onChange={handleChange}
                  className="w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-900 dark:text-white"
                >
                  <option value="">-- Select Team --</option>
                  {teams.map((team) => (
                    <option key={team.value} value={team.value}>
                      {team.label}
                    </option>
                  ))}
                </select>
                {localErrors.team_id && <p className="text-red-500 text-xs mt-1">{localErrors.team_id}</p>}
              </div>
            )}

            {form.scope === "private" && role === "manager" && (
              <div>
                <Label htmlFor="target_user_id">Target User *</Label>
                <select
                  id="target_user_id"
                  name="target_user_id"
                  value={form.target_user_id}
                  onChange={handleChange}
                  className="w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-900 dark:text-white"
                >
                  <option value="">-- Select User --</option>
                  {filteredTargetUsers.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
                </select>
                {localErrors.target_user_id && (
                  <p className="text-red-500 text-xs mt-1">{localErrors.target_user_id}</p>
                )}
              </div>
            )}

            {form.scope === "private" && role === "employee" && (
              <div>
                <Label htmlFor="target_user_display">Target User</Label>
                <Input id="target_user_display" value={displayUserName} disabled />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={propOnClose}>
              Cancel
            </Button>
            <Button type="submit">Save Event</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
