
import React from "react";
import { useNavigate } from "react-router-dom";
import UpcomingLeaves from "../common/UpcomingLeaves"; // Reuse existing component

const Leaves = () => {
  const navigate = useNavigate();

  const handleApplyClick = () => {
    navigate("/employee/apply-leave");
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Leaves</h1>
          <p className="text-sm text-gray-500">Apply for leave and track your upcoming leaves here.</p>
        </div>
        <button
          onClick={handleApplyClick}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
        >
          Apply Leave
        </button>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Upcoming Leaves</h2>
        <UpcomingLeaves />
      </section>
    </div>
  );
};

export default Leaves;
