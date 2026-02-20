import React, { useEffect, useState } from "react";
import axios from "axios";
import Input from "../../../components/form/input/Input";
import Button from "../../../components/ui/button/Button";
import ComponentCard from "../../../components/common/ComponentCard";
import { toast } from "react-toastify";
import { UserCog } from "lucide-react";

const AssignManagers = () => {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [primaryManager, setPrimaryManager] = useState("");
  const [secondaryManager, setSecondaryManager] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [usersRes, managersRes] = await Promise.all([
          axios.get("/api/users", { headers }),
          axios.get("/api/users?role=manager", { headers }),
        ]);

        setUsers(usersRes.data.users || []);
        setManagers(managersRes.data.users || []);
      } catch (err) {
        console.error("Error fetching users/managers:", err);
        toast.error("Failed to load user data.");
      }
    };

    fetchData();
  }, [token]);

  const handleAssign = async () => {
    if (!selectedUser) {
      toast.warning("Please select an employee.");
      return;
    }

    setLoading(true);

    try {
      await axios.patch(
        `/api/users/assign-managers/${selectedUser}`,
        {
          manager_id_primary: primaryManager || null,
          manager_id_secondary: secondaryManager || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Managers assigned successfully!");
      setSelectedUser("");
      setPrimaryManager("");
      setSecondaryManager("");
    } catch (err) {
      console.error("Failed to assign managers:", err);
      toast.error("Assignment failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (e) => {
  const selectedId = e.target.value;
  setSelectedUser(selectedId);

  const selectedUserObj = users.find((user) => user.user_id === parseInt(selectedId));
  if (selectedUserObj) {
    setPrimaryManager(selectedUserObj.manager_id_primary || "");
    setSecondaryManager(selectedUserObj.manager_id_secondary || "");
  }
};


  return (
    <ComponentCard>
      <div className="mb-6 flex items-center gap-2">
        <UserCog size={22} className="text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Assign Managers to Employees
        </h2>
      </div>

      {/* Employee Dropdown */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Select Employee
        </label>
        <select
  value={selectedUser}
  onChange={handleUserSelect}
  className="w-full rounded border-gray-300 dark:bg-gray-800 dark:text-white"
>
  <option value="">-- Select --</option>
  {users.map((user) => (
    <option key={user.user_id} value={user.user_id}>
      {user.first_name} {user.last_name}
      {user.PrimaryManager ? ` | Primary: ${user.PrimaryManager.first_name} ${user.PrimaryManager.last_name}` : ''}
      {user.SecondaryManager ? ` | Secondary: ${user.SecondaryManager.first_name} ${user.SecondaryManager.last_name}` : ''}
    </option>
  ))}
</select>

      </div>

      {/* Primary Manager */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Primary Manager
        </label>
        <select
          value={primaryManager}
          onChange={(e) => setPrimaryManager(e.target.value)}
          className="w-full rounded border-gray-300 dark:bg-gray-800 dark:text-white"
        >
          <option value="">-- None --</option>
          {managers.map((mgr) => (
            <option key={mgr.user_id} value={mgr.user_id}>
              {mgr.first_name} {mgr.last_name}
            </option>
          ))}
        </select>
      </div>

      {/* Secondary Manager */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Secondary Manager
        </label>
        <select
          value={secondaryManager}
          onChange={(e) => setSecondaryManager(e.target.value)}
          className="w-full rounded border-gray-300 dark:bg-gray-800 dark:text-white"
        >
          <option value="">-- None --</option>
          {managers.map((mgr) => (
            <option key={mgr.user_id} value={mgr.user_id}>
              {mgr.first_name} {mgr.last_name}
            </option>
          ))}
        </select>
      </div>

      <Button onClick={handleAssign} disabled={loading} size="lg">
        {loading ? "Assigning..." : "Assign Managers"}
      </Button>
    </ComponentCard>
  );
};

export default AssignManagers;
