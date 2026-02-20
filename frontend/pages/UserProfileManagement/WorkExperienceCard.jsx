import { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal"; 
import { Modal } from "../../pages/../components/ui/modal";
import Button from "../../pages/../components/ui/button/Button";
import Input from "../../pages/../components/form/input/Input";
import Label from "../../pages/../components/form/Label";
import axios from "axios";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-toastify';

const workExperienceFields = [
  { key: "company_name", label: "Company Name", mandatory: true },
  { key: "company_url", label: "Company URL", mandatory: false, type: "url" },
  { key: "work_from", label: "Worked From", type: "date", mandatory: true },
  { key: "work_to", label: "Worked To", type: "date", mandatory: true },
  { key: "contact_number", label: "Contact Number", mandatory: false, type: "tel" },
  { key: "contact_email", label: "Contact Email", mandatory: false, type: "email" },
  { key: "letter", label: "Upload Letter (Image only)", type: "file", mandatory: false },
];


const defaultFormData = {
  company_name: "",
  company_url: "",
  work_from: null,
  work_to: null,
  contact_number: "",
  contact_email: "",
  letter: null,
};

export default function WorkExperienceCard({ userData, refreshUserData }) {
  const { isOpen, openModal, closeModal } = useModal();
  const [workExperienceList, setWorkExperienceList] = useState([]);
  const [hasExperience, setHasExperience] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [localErrors, setLocalErrors] = useState({});
  const [loading, setLoading] = useState(false);
  // New state to hold the item being edited
  const [editingItem, setEditingItem] = useState(null);

  // Use userData.user_id directly as the userId for this component
  const userId = userData?.user_id;
  const token = localStorage.getItem("token");

  // Function to fetch work experience data
  const fetchWorkExperience = async () => {
    if (!userId || !token) return;
    try {
      // GET URL correctly includes userId as per your backend route
      const res = await axios.get(`http://localhost:5001/api/user-work-experience/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const experienceList = Array.isArray(res.data) ? res.data : res.data.data || [];
      setWorkExperienceList(experienceList.slice(-5).reverse());
    } catch (err) {
      console.error("Error fetching work experience:", err);
      toast.error("Failed to fetch work experience data.");
    }
  };

  // Fetch data on component mount and when userId or token changes
  useEffect(() => {
    fetchWorkExperience();
  }, [userId, token]);

  // Reset form data and errors when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
      setLocalErrors({});
      setEditingItem(null); // Clear editing item when modal closes
    }
  }, [isOpen]);

  const handleDateChange = (date, fieldName) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: date,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "file" ? files[0] : value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (hasExperience) {
      workExperienceFields.forEach(field => {
        if (field.mandatory && !formData[field.key]) {
          newErrors[field.key] = `${field.label} is required.`;
          isValid = false;
        }
      });

      if (formData.contact_number && !/^\d{10}$/.test(String(formData.contact_number))) {
        newErrors.contact_number = "Contact number must be exactly 10 digits.";
        isValid = false;
      }

      if (formData.contact_email && !formData.contact_email.includes('@')) {
        newErrors.contact_email = "Email must contain an '@' symbol.";
        isValid = false;
      }

      if (formData.work_from && formData.work_to) {
        if (formData.work_to < formData.work_from) {
          newErrors.work_to = "End date cannot be before start date.";
          isValid = false;
        }
      }
    }

    setLocalErrors(newErrors);
    return isValid;
  };

  const handleAddExperience = async () => {
    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    setLoading(true);
    setLocalErrors({});

    try {
      const formPayload = new FormData();
      formPayload.append("company_name", formData.company_name);
      formPayload.append("company_url", formData.company_url);
      formPayload.append("work_from", formData.work_from?.toISOString().split('T')[0] || '');
      formPayload.append("work_to", formData.work_to?.toISOString().split('T')[0] || '');
      formPayload.append("contact_number", formData.contact_number);
      formPayload.append("contact_email", formData.contact_email);
      if (formData.letter) {
        formPayload.append("letter", formData.letter);
      }
      formPayload.append("user_id", userId);
      formPayload.append("organization_id", userData.organization_id);

      // CRITICAL: Corrected POST request URL to include userId in the path
      await axios.post(`http://localhost:5001/api/user-work-experience/${userId}`, formPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Work experience added successfully!");
      fetchWorkExperience();
      resetForm();
      closeModal();
    } catch (err) {
      console.error("Failed to add experience", err);
      toast.error(`Failed to add experience: ${err.message || "An unexpected error occurred."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditExperience = async () => {
    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    setLoading(true);
    setLocalErrors({});

    try {
      const formPayload = new FormData();
      formPayload.append("company_name", formData.company_name);
      formPayload.append("company_url", formData.company_url);
      formPayload.append("work_from", formData.work_from?.toISOString().split('T')[0] || '');
      formPayload.append("work_to", formData.work_to?.toISOString().split('T')[0] || '');
      formPayload.append("contact_number", formData.contact_number);
      formPayload.append("contact_email", formData.contact_email);
      if (formData.letter && typeof formData.letter !== 'string') { // Only append letter if a new one is selected
        formPayload.append("letter", formData.letter);
      }

      // Ensure we get the correct ID for the item being edited
      const experienceId = editingItem?.id || editingItem?.work_experience_id; // Use 'id' or 'experience_id' depending on your backend's response structure

      await axios.put(`http://localhost:5001/api/user-work-experience/${userId}/${experienceId}`, formPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Work experience updated successfully!");
      fetchWorkExperience();
      resetForm();
      closeModal();
    } catch (err) {
      console.error("Failed to update experience", err);
      // More detailed error message from backend if available
      const errorMessage = err.response?.data?.message || err.message || "An unexpected error occurred.";
      toast.error(`Failed to update experience: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };


  const onEdit = (item) => {
    setEditingItem(item);
    // Convert date strings to Date objects for ReactDatePicker
    setFormData({
      ...item,
      work_from: item.work_from ? new Date(item.work_from) : null,
      work_to: item.work_to ? new Date(item.work_to) : null,
    });
    setHasExperience(true); // Always set to true when editing an existing entry
    openModal();
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setHasExperience(false);
    setLocalErrors({});
    setEditingItem(null); // Ensure editingItem is reset
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Work Experience</h3>
        <button
          onClick={openModal}
          className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        >
          <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
            />
          </svg>
          Add
        </button>
      </div>

      <div className="text-sm">
        {workExperienceList.length === 0 ? (
          <p className="text-gray-600">No work experience added yet.</p>
        ) : (
          <table className="w-full text-left border mt-3 text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="p-2">Company</th>
                <th className="p-2">URL</th>
                <th className="p-2">From</th>
                <th className="p-2">To</th>
                <th className="p-2">Contact</th>
                <th className="p-2">Email</th>
                <th className="p-2">Letter</th>
                <th className="p-2">Actions</th> {/* New column for actions */}
              </tr>
            </thead>
            <tbody>
              {workExperienceList.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{item.company_name || "—"}</td>
                  <td className="p-2">{item.company_url || "—"}</td>
                  <td className="p-2">{formatDateForDisplay(item.work_from)}</td>
                  <td className="p-2">{formatDateForDisplay(item.work_to)}</td>
                  <td className="p-2">{item.contact_number || "—"}</td>
                  <td className="p-2">{item.contact_email || "—"}</td>
                  <td className="p-2">
                    {item.letter ? (
                      <img
                        src={`http://localhost:5001/${item.letter}`}
                        alt="Experience Letter"
                        className="h-12 w-12 object-cover rounded"
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/48x48/cccccc/000000?text=Error"; }}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {editingItem ? "Edit Work Experience" : "Add Work Experience"}
          </h4>

          <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); editingItem ? handleEditExperience() : handleAddExperience(); }}>
            {/* Experience dropdown */}
            <div className="sm:col-span-2">
              <Label htmlFor="hasExperience">Do you have experience?</Label>
              <select
                id="hasExperience"
                className="w-full border border-gray-300 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white"
                value={hasExperience ? "yes" : "no"}
                onChange={(e) => setHasExperience(e.target.value === "yes")}
                disabled={!!editingItem} // Disable if editing an item
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            {hasExperience && (
              <>
                {workExperienceFields.map((field) => {
                  const label = field.label;
                  const isRequired = field.mandatory;

                  if (field.type === "date") {
                    return (
                      <div key={field.key}>
                        <Label htmlFor={field.key}>{label} {isRequired && <span className="text-red-500">*</span>}</Label>
                        <ReactDatePicker
                          id={field.key}
                          selected={formData[field.key]}
                          onChange={(date) => handleDateChange(date, field.key)}
                          dateFormat="dd/MM/yyyy"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-800 dark:text-white"
                          placeholderText="Select date"
                          maxDate={new Date()}
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                          minDate={field.key === "work_to" ? formData.work_from : null}
                          required={isRequired}
                        />
                        {localErrors[field.key] && <p className="text-red-500 text-xs mt-1">{localErrors[field.key]}</p>}
                      </div>
                    );
                  } else if (field.type === "file") {
                    return (
                      <div key={field.key} className="sm:col-span-2">
                        <Label htmlFor={field.key}>{label} {isRequired && <span className="text-red-500">*</span>}</Label>
                        <input
                          id={field.key}
                          type="file"
                          name={field.key}
                          accept="image/*"
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white"
                          required={isRequired && !editingItem?.letter} // Required if adding or no existing letter
                        />
                        {editingItem?.letter && (
                          <p className="text-xs text-gray-500 mt-1">
                            Current file: <a href={`http://localhost:5001/${editingItem.letter}`} target="_blank" rel="noopener noreferrer" className="text-blue-500">View</a> (Upload new to replace)
                          </p>
                        )}
                        {localErrors[field.key] && <p className="text-red-500 text-xs mt-1">{localErrors[field.key]}</p>}
                      </div>
                    );
                  } else {
                    return (
                      <div key={field.key}>
                        <Label htmlFor={field.key}>{label} {isRequired && <span className="text-red-500">*</span>}</Label>
                        <Input
                          id={field.key}
                          name={field.key}
                          type={field.type || "text"}
                          value={formData[field.key] || ""}
                          onChange={handleChange}
                          required={isRequired}
                          maxLength={field.key === "contact_number" ? 10 : undefined}
                          pattern={field.key === "contact_number" ? "[0-9]{10}" : undefined}
                          title={field.key === "contact_number" ? "Please enter exactly 10 digits" : undefined}
                        />
                        {localErrors[field.key] && <p className="text-red-500 text-xs mt-1">{localErrors[field.key]}</p>}
                      </div>
                    );
                  }
                })}
              </>
            )}
            <div className="sm:col-span-2 flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeModal} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (editingItem ? "Updating..." : "Adding...") : (editingItem ? "Update" : "Add")}
              </Button>
            </div>
            {localErrors.api && <p className="mt-3 text-sm text-red-600">{localErrors.api}</p>}
          </form>
        </div>
      </Modal>
    </div>
  );
}