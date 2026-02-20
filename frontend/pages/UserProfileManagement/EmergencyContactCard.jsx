import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../pages/../components/ui/modal";
import Button from "../../pages/../components/ui/button/Button";
import Input from "../../pages/../components/form/input/Input";
import Label from "../../pages/../components/form/Label";
import SelectField from "../../pages/../components/form/input/SelectField";
import useUserProfile from "../../hooks/useUserProfile";
import { toast } from 'react-toastify'; 

const relationshipOptions = [
  "Mother",
  "Father",
  "Brother",
  "Sister",
  "Wife",
  "Husband",
  "Guardian", 
];

export default function EmergencyContactCard({ userData, refreshUserData }) {
  const { isOpen, openModal, closeModal } = useModal();
  const {
    formData,
    setFormData,
    handleChange,
    handleSave,
    loading,
    error, 
  } = useUserProfile();

  const [localErrors, setLocalErrors] = useState({}); 

  const mandatoryFields = [
    "emergency_contact_name",
    "emergency_contact_relation",
    "emergency_contact_number",
    "emergency_contact_email",
  ];

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Check  mandatory fields
    mandatoryFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} is required.`;
        isValid = false;
      }
    });

    // validation for emergency_contact_number 
    if (formData.emergency_contact_number) {
      const contactNum = String(formData.emergency_contact_number);
      if (!/^\d{10}$/.test(contactNum)) {
        newErrors.emergency_contact_number = "Phone number must be exactly 10 digits.";
        isValid = false;
      }
    }

    // validation for emergency_contact_email (contains @)
    if (formData.emergency_contact_email) {
      if (!formData.emergency_contact_email.includes('@')) {
        newErrors.emergency_contact_email = "Email must contain an '@' symbol.";
        isValid = false;
      }
    }

    setLocalErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    if (userData) {
      setFormData({
        emergency_contact_name: userData.emergency_contact_name || "",
        emergency_contact_relation: userData.emergency_contact_relation || "",
        emergency_contact_number: userData.emergency_contact_number || "",
        emergency_contact_email: userData.emergency_contact_email || "",
      });
    }
  }, [userData, setFormData]); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    const emergencyData = {
      emergency_contact_name: formData.emergency_contact_name,
      emergency_contact_relation: formData.emergency_contact_relation,
      emergency_contact_number: formData.emergency_contact_number,
      emergency_contact_email: formData.emergency_contact_email,
    };

    try {
      await handleSave(emergencyData, userData.user_id);
      closeModal();
      if (refreshUserData) {
        await refreshUserData();
      }
      toast.success("Emergency contact details updated successfully!"); 
    } catch (err) {
      console.error("Error saving emergency contact:", err);
      toast.error(`Failed to update emergency contact: ${err.message || "An unexpected error occurred."}`); 
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Emergency Contact</h3>
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
        <Field name="emergency_contact_name" value={userData?.emergency_contact_name} />
        <Field name="emergency_contact_relation" value={userData?.emergency_contact_relation} />
        <Field name="emergency_contact_number" value={userData?.emergency_contact_number} />
        <Field name="emergency_contact_email" value={userData?.emergency_contact_email} />
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Edit Emergency Contact</h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Update emergency contact information below.</p>

          <form onSubmit={handleSubmit}>
            <div className="custom-scrollbar h-[300px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                {/* Emergency Contact Name */}
                <div>
                  <Label htmlFor="emergency_contact_name">Contact Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    value={formData?.emergency_contact_name}
                    onChange={handleChange}
                    required
                  />
                  {localErrors.emergency_contact_name && <p className="text-red-500 text-xs mt-1">{localErrors.emergency_contact_name}</p>}
                </div>

                {/* Emergency Contact Relationship (Dropdown) */}
                <div>
                  <Label htmlFor="emergency_contact_relation">Relationship <span className="text-red-500">*</span></Label>
                  <SelectField
                    id="emergency_contact_relation"
                    name="emergency_contact_relation"
                    value={formData?.emergency_contact_relation}
                    onChange={handleChange}
                    options={relationshipOptions}
                    required
                  />
                  {localErrors.emergency_contact_relation && <p className="text-red-500 text-xs mt-1">{localErrors.emergency_contact_relation}</p>}
                </div>

                {/* Emergency Contact Phone */}
                <div>
                  <Label htmlFor="emergency_contact_number">Phone <span className="text-red-500">*</span></Label>
                  <Input
                    id="emergency_contact_number"
                    name="emergency_contact_number"
                    value={formData?.emergency_contact_number}
                    onChange={handleChange}
                    type="tel" 
                    maxLength={10} 
                    pattern="[0-9]{10}"
                    title="Please enter exactly 10 digits" //tooltip
                    required
                  />
                  {localErrors.emergency_contact_number && <p className="text-red-500 text-xs mt-1">{localErrors.emergency_contact_number}</p>}
                </div>

                {/* Emergency Contact Email */}
                <div>
                  <Label htmlFor="emergency_contact_email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="emergency_contact_email"
                    name="emergency_contact_email"
                    value={formData?.emergency_contact_email}
                    onChange={handleChange}
                    type="email" 
                    required
                  />
                  {localErrors.emergency_contact_email && <p className="text-red-500 text-xs mt-1">{localErrors.emergency_contact_email}</p>}
                </div>
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

            {/* Display error from useUserProfile hook if any */}
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </form>
        </div>
      </Modal>
    </div>
  );
}

function Field({ name, value }) {
  const formatDisplayName = (fieldName) => {
    return fieldName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div>
      <p className="text-gray-500 mb-1 capitalize">{formatDisplayName(name)}</p>
      <p className="text-gray-800 dark:text-white/90 font-medium break-words">{value || "—"}</p>
    </div>
  );
}

function InputField({ label, name, value, onChange, type = "text", maxLength, pattern, title, required = false }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        pattern={pattern}
        title={title}
        required={required}
      />
    </div>
  );
}
