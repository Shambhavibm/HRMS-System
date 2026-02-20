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

const genderOptions = ["Male", "Female", "Other" ];
const maritalOptions = ["Single", "Married", "Divorced", "Widowed"];
const bloodOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const editableFields = [
  "first_name",
  "last_name",
  "official_email_id",
  "secondary_email_id",
  "contact_number",
  "date_of_birth",
  "gender",
  "nationality",
  "marital_status",
  "blood_group",
  "address_line1",
  "address_line2",
  "city",
  "state",
  "zip_code",
  "country",
  "father_name",
  "mother_name",
  "bio",
];

const readOnlyFields = ["first_name", "last_name", "official_email_id"];

export default function UserInfoCard({ userData, refreshUserData }) {
  const { isOpen, openModal, closeModal } = useModal();
  const { formData, setFormData, handleChange, handleSave, loading, error } = useUserProfile();

  // State for local form validation errors
  const [localErrors, setLocalErrors] = useState({});

 
  useEffect(() => {
    if (userData) {
      setFormData(userData);
    }
  }, [userData, setFormData]); 

  // Frontend validation function
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    
    editableFields.forEach(field => {
      if (!formData[field] && !readOnlyFields.includes(field)) {
        newErrors[field] = `${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} is required.`;
        isValid = false;
      }
    });

    // validation for contact_number
    if (formData.contact_number) {
      const contactNum = String(formData.contact_number); // Ensure it's a string
      if (!/^\d{10}$/.test(contactNum)) {
        newErrors.contact_number = "Contact number must be exactly 10 digits.";
        isValid = false;
      }
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

    const userInfoData = editableFields.reduce((data, key) => {
      data[key] = formData[key];
      return data;
    }, {});

    try {
      await handleSave(userInfoData, userData.user_id);
      closeModal();
      if (refreshUserData) {
        await refreshUserData(); 
      }
      toast.success("Profile information updated successfully!");
    } catch (err) {
      console.error("Error saving user info:", err);
      toast.error(`Failed to update profile: ${err.message || "An unexpected error occurred."}`);
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Profile Information</h3>
        <button
          onClick={openModal}
          className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
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
        {userData && editableFields.map((key) => (
          <div key={key}>
            <p className="text-gray-500 mb-1 capitalize">{key.replace(/_/g, " ")}</p>
            {/* Displaying data from userData prop for initial view */}
            <p className="text-gray-800 dark:text-white/90 font-medium break-all">
              {key === "date_of_birth" && userData[key] ? new Date(userData[key]).toLocaleDateString() : userData[key] || "—"}
            </p>
          </div>
        ))}
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Edit Personal Information
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            All fields are mandatory. Please fill in your latest information.
          </p>

          <form className="flex flex-col" onSubmit={handleSubmit}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                {editableFields.map((field) => {
                  const label = field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                  const isRequired = !readOnlyFields.includes(field); 
                  if (["gender", "marital_status", "blood_group"].includes(field)) {
                    const options = field === "gender" ? genderOptions : field === "marital_status" ? maritalOptions : bloodOptions;
                    return (
                      <div key={field}>
                        <Label htmlFor={field}>{label} {isRequired && <span className="text-red-500">*</span>}</Label>
                        <SelectField
                           id={field}
                          name={field}
                          value={formData[field] || ""}
                          onChange={handleChange}
                          options={options}
                          hasPlaceholder={true}
                        />
                        {localErrors[field] && <p className="text-red-500 text-xs mt-1">{localErrors[field]}</p>}
                      </div>
                    );
                  } if (field === "date_of_birth") {
                    return (                             
                      <div key={field}>
                        <Label htmlFor={field}>{label} {isRequired && <span className="text-red-500">*</span>}</Label>
                         <ReactDatePicker
                          id={field}
                          selected={formData[field]}
                          onChange={(date) => setFormData(prev => ({ ...prev, date_of_birth: date?.toISOString().split("T")[0] || "" }))}
                          placeholderText="Select date"
                          maxDate={new Date()}
                          dateFormat="dd/MM/YYYY"
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          />
                        {localErrors[field] && <p className="text-red-500 text-xs mt-1">{localErrors[field]}</p>}
                      </div>
                    );
                  } else if (field === "bio") {
                    return (
                      <div key={field} className="lg:col-span-2">
                        <Label htmlFor={field}>Bio {isRequired && <span className="text-red-500">*</span>}</Label>
                        <textarea
                          id={field}
                          name={field}
                          value={formData ? formData.bio : ""}
                          onChange={handleChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          rows={4}
                          />
                        {localErrors[field] && <p className="text-red-500 text-xs mt-1">{localErrors[field]}</p>}
                      </div>
                    );
                  } else if (readOnlyFields.includes(field)) {
                    return (
                      <div key={field}>
                        <Label htmlFor={field}>{label} {isRequired && <span className="text-red-500">*</span>}</Label>
                        <Input
                          id={field}
                          name={field}
                          type="text"
                          value={userData ? userData[field] : ""} 
                          disabled
                         />
                        {localErrors[field] && <p className="text-red-500 text-xs mt-1">{localErrors[field]}</p>}
                      </div>
                    );
                  } else if (field === "contact_number") { 
                    return (
                      <div key={field}>
                        <Label htmlFor={field}>{label} {isRequired && <span className="text-red-500">*</span>}</Label>
                        <Input
                          id={field}
                          name={field}
                          type="tel" 
                          value={formData ? formData[field] : ""}
                          onChange={handleChange}
                          maxLength={10} 
                          pattern="[0-9]{10}" 
                          title="Please enter exactly 10 digits" 
                          />
                        {localErrors[field] && <p className="text-red-500 text-xs mt-1">{localErrors[field]}</p>}
                      </div>
                    );
                  }
                  else {
                    return (
                      <div key={field}>
                        <Label htmlFor={field}>{label} {isRequired && <span className="text-red-500">*</span>}</Label>
                        <Input
                          id={field}
                          name={field}
                          type="text"
                          value={formData ? formData[field] : ""}
                          onChange={handleChange}
                          />
                        {localErrors[field] && <p className="text-red-500 text-xs mt-1">{localErrors[field]}</p>}
                      </div>
                    );
                  }
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </form>
        </div>
      </Modal>
    </div>
  );
}