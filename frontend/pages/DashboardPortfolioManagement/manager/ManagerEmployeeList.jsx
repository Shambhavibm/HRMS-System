import React from "react";

const ManagerEmployeeList = ({ users }) => {
  if (!users.length) return <p className="text-gray-500">No team members found.</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">🧑‍💼 Your Team Members</h2>
      <div className="overflow-x-auto rounded-xl shadow border">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Designation</th>
              <th className="p-3 text-left">Phone</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id} className="border-b hover:bg-gray-50">
                <td className="p-3">{user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.designation || "—"}</td>
                <td className="p-3">{user.phone_number || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerEmployeeList;
