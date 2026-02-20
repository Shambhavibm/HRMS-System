import { useEffect, useState } from "react"; 
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../pages/../components/ui/modal";
import Button from "../../pages/../components/ui/button/Button";
import Input from "../../pages/../components/form/input/Input";
import Label from "../../pages/../components/form/Label";
import SelectField from "../../pages/../components/form/input/SelectField";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; 
import useUserProfile from "../../hooks/useUserProfile";
import { toast } from 'react-toastify'; 
import axios from "axios";
import Select from "react-select";
import majorCities from "../../utils/majorCities"; 

const employmentTypeOptions = ["Full-time", "Part-time", "Contractor", "Intern"];
const workLocationOptions = ["Physical office", "Remote", "Hybrid"];



const mandatoryFields = [
  "date_of_joining",
  "designation",
  "department",
  "employment_type",
  "work_location",
];

export default function EmployeeDetailsCard({ userData, refreshUserData }) {
  const { isOpen, openModal, closeModal } = useModal();
  const { formData, handleChange, handleSave, setFormData, loading, error: apiError } = useUserProfile(); 

  const [localErrors, setLocalErrors] = useState({}); 
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (userData) {
      setFormData({
        employee_id: userData.employee_id || "",
        date_of_joining: userData.date_of_joining || "",
        designation: userData.designation || "",
        department: userData.department || "",
        manager_id: userData.manager_id || "",
        employment_type: userData.employment_type || "",
        work_location: userData.work_location || "",
        notes: userData.notes || "",
        about_me: userData.about_me || "",
      });
    }
  }, [userData, setFormData]);

  
useEffect(() => {
  const fetchCities = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("/api/office-locations/cities", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const dbCities = res.data;

    // Combine majorCities and dbCities, normalize to lowercase for uniqueness
    const allCities = [...majorCities, ...dbCities].map(c => c.toLowerCase());

    // Deduplicate and capitalize for dropdown display
    const uniqueCities = Array.from(new Set(allCities)).map(
      c => c.charAt(0).toUpperCase() + c.slice(1)
    );

    setCities(uniqueCities);
  } catch (err) {
    console.error("Failed to load cities", err);
  }
};


  fetchCities();
}, []);


  const handleDateChange = (name, date) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date?.toISOString().split("T")[0] || "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    mandatoryFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} is required.`;
        isValid = false;
      }
    });

    // // Specific validation for manager_id (if it's not null, it should be a valid number)
    // if (formData.manager_id && !/^\d+$/.test(String(formData.manager_id))) {
    //   newErrors.manager_id = "Manager ID must be a number.";
    //   isValid = false;
    // }

    setLocalErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    const employeeData = {
      employee_id:userData?.user_id,
      date_of_joining: formData.date_of_joining,
      designation: formData.designation,
      department: formData.department,
      manager_id: formData.manager_id || null,
      employment_type: formData.employment_type,
      work_location: formData.work_location,
      notes: formData.notes,
      about_me: formData.about_me,
    };

    try {
      await handleSave(employeeData, userData?.user_id);
      closeModal();
      if (refreshUserData) {
        await refreshUserData(); 
      }
      toast.success("Employee details updated successfully!"); 
    } catch (err) {
      console.error("Error saving employee details:", err);
      toast.error(`Failed to update employee details: ${err.message || "An unexpected error occurred."}`); 
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Employee Details</h3>
        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
            />
          </svg>
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
        {/* Displaying data from userData prop for initial view */}
        {userData && Object.entries({
          employee_id: userData.employee_id,
          date_of_joining: userData.date_of_joining,
          designation: userData.designation,
          department: userData.department,
          manager_id: userData.manager_id ?? "Unassigned",
          employment_type: userData.employment_type,
          work_location: userData.work_location,
          notes: userData.notes,
          about_me: userData.about_me,
        }).map(([key, value]) => (
          <div key={key}>
            <p className="text-gray-500 mb-1 capitalize">{key.replace(/_/g, " ")}</p>
            <p className="text-gray-800 dark:text-white/90 font-medium break-words">
              {key === "date_of_joining" && value ? new Date(value).toLocaleDateString() : value || "—"}
            </p>
          </div>
        ))}
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Edit Employee Details</h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Update employee information below.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                {/* Employee ID (Read-only) */}
                <div>
                  <Label htmlFor="employee_id">Employee ID</Label>
                  <Input
                    id="employee_id"
                    name="employee_id"
                    value={userData?.user_id || ''}
                    onChange={handleChange}
                    disabled
                  />
                  {/* {localErrors.employee_id && <p className="text-red-500 text-xs mt-1">{localErrors.employee_id}</p>} */}
                </div>

                {/* Date of Joining */}
                <div>
                  <Label htmlFor="date_of_joining">Date of Joining <span className="text-red-500">*</span></Label>
                  <ReactDatePicker
                    name="date_of_joining"
                    placeholderText="Select date"
                    selected={formData.date_of_joining}
                    value={formData.date_of_joining ? new Date(formData.date_of_joining) : null}
                    onChange={(date) => handleDateChange("date_of_joining", date)}
                    dateFormat="dd/MM/YYYY"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    required
                  />
                  {localErrors.date_of_joining && <p className="text-red-500 text-xs mt-1">{localErrors.date_of_joining}</p>}
                </div>

                {/* Designation */}
                <div>
                  <Label htmlFor="designation">Designation <span className="text-red-500">*</span></Label>
                  <Input label="Designation" name="designation" value={formData.designation} onChange={handleChange} required />
                  {localErrors.designation && <p className="text-red-500 text-xs mt-1">{localErrors.designation}</p>}
                </div>

                {/* Department */}
                <div>
                  <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
                  <Input label="Department" name="department" value={formData.department} onChange={handleChange} required />
                  {localErrors.department && <p className="text-red-500 text-xs mt-1">{localErrors.department}</p>}
                </div>

                {/* Manager ID (Not mandatory) */}
                <div>
                  <Label htmlFor="manager_id">Manager ID</Label>
                  <Input label="Manager ID" name="manager_id" type="number" value={formData.manager_id} onChange={handleChange} disabled/>
                  {localErrors.manager_id && <p className="text-red-500 text-xs mt-1">{localErrors.manager_id}</p>}
                </div>

                {/* Employment Type */}
                <div>
                  <Label htmlFor="employment_type">Employment Type <span className="text-red-500">*</span></Label>
                  <SelectField
                    name="employment_type"
                    value={formData.employment_type}
                    onChange={handleChange}
                    options={employmentTypeOptions}
                    required
                  />
                  {localErrors.employment_type && <p className="text-red-500 text-xs mt-1">{localErrors.employment_type}</p>}
                </div>

                {/* Work Location */}
                <div>
                  <Label htmlFor="work_location">Work Location <span className="text-red-500">*</span></Label>
        <Select
  name="work_location"
  options={[
    { label: "Remote", value: "Remote" },
    { label: "Hybrid", value: "Hybrid" },
    ...cities.map((city) => ({ label: city, value: city }))
  ]}
  value={{ label: formData.work_location, value: formData.work_location }}
  onChange={(selected) =>
    handleChange({
      target: {
        name: "work_location",
        value: selected?.value || ""
      }
    })
  }
/>



                  {localErrors.work_location && <p className="text-red-500 text-xs mt-1">{localErrors.work_location}</p>}
                </div>

                {/* Notes (Not mandatory) */}
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input label="Notes" name="notes" value={formData.notes} onChange={handleChange} />
                  {localErrors.notes && <p className="text-red-500 text-xs mt-1">{localErrors.notes}</p>}
                </div>

                {/* About Me (Not mandatory) */}
                <div>
                  <Label htmlFor="about_me">About Me</Label>
                  <Input label="About Me" name="about_me" value={formData.about_me} onChange={handleChange} />
                  {localErrors.about_me && <p className="text-red-500 text-xs mt-1">{localErrors.about_me}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button size="sm" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button size="sm" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
            {apiError && <p className="text-red-500 text-sm mt-2">{apiError}</p>}
          </form>
        </div>
      </Modal>
    </div>
  );
}

function InputField({ label, name, value, onChange, type = "text", disabled = false, required = false }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
      />
    </div>
  );
}
