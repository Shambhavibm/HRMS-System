import React, { useEffect } from "react";
import { X, Mail, Phone, Calendar, User, Users } from "lucide-react";

const EmployeeDetailsModal = ({ employee, onClose }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!employee) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative animate-fade-in">
        {/* Close Button */}
        <button
          className="absolute top-3 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6 border-b pb-3">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            👤 {employee.first_name} {employee.last_name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Role: {employee.role?.toUpperCase()}
          </p>
        </div>

        {/* Grid Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-200">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <span>{employee.official_email_id}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{employee.phone_number || "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span>{employee.gender || "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{employee.date_of_birth || "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span>Marital: {employee.marital_status || "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Emergency Email:</span>
            <span>{employee.emergency_contact_email || "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Relation:</span>
            <span>{employee.emergency_contact_relation || "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Father:</span>
            <span>{employee.father_name || "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Mother:</span>
            <span>{employee.mother_name || "—"}</span>
          </div>
        </div>

        {/* Description Fields */}
        <div className="mt-6 space-y-3 text-sm text-gray-700 dark:text-gray-200">
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Bio</h4>
            <p className="text-gray-600 dark:text-gray-400">{employee.bio || "—"}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-1">About Me</h4>
            <p className="text-gray-600 dark:text-gray-400">{employee.about_me || "—"}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Notes</h4>
            <p className="text-gray-600 dark:text-gray-400">{employee.notes || "—"}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsModal;
