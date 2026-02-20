import { useEffect, useState } from "react"; 
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../pages/../components/ui/modal";
import Button from "../../pages/../components/ui/button/Button";
import Input from "../../pages/../components/form/input/Input";
import Label from "../../pages/../components/form/Label";
import useUserProfile from "../../hooks/useUserProfile";
import { toast } from 'react-toastify'; 


export default function FinancialDetailsCard({ userData, refreshUserData }) {
  const { isOpen, openModal, closeModal } = useModal();
  const { formData, setFormData, handleChange, handleSave, loading } = useUserProfile();

  const [localErrors, setLocalErrors] = useState({}); 

  
  const mandatoryFields = [
    "bank_name",
    "bank_account_number", 
    "ifsc_code",
    "pan_number",
    "aadhaar_number",
    "voter_id"
  ];

  
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    mandatoryFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} is required.`;
        isValid = false;
      }
    });

    // Add specific validation for account number if needed (e.g., min/max length, numeric)
    if (formData.bank_account_number && !/^\d+$/.test(formData.bank_account_number)) {
      newErrors.bank_account_number = "Account number must be numeric.";
      isValid = false;
    }
    // Add specific validation for Aadhaar (e.g., 12 digits)
    if (formData.aadhaar_number && !/^\d{12}$/.test(formData.aadhaar_number)) {
      newErrors.aadhaar_number = "Aadhaar number must be exactly 12 digits.";
      isValid = false;
    }
    // Add specific validation for PAN (e.g., ABCDE1234F)
    if (formData.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number)) {
      newErrors.pan_number = "PAN number format is invalid.";
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

    const financialData = {
      bank_name: formData?.bank_name,
      bank_account_number: formData?.bank_account_number,
      ifsc_code: formData?.ifsc_code,
      pan_number: formData?.pan_number,
      voter_id: formData?.voter_id,
      aadhaar_number: formData?.aadhaar_number,
    };
    console.log("Financial Data to Save:", financialData);
    try {
      await handleSave(financialData, userData?.user_id);
      closeModal();
      if (refreshUserData) {
        await refreshUserData();
      }
      toast.success("Financial details updated successfully!"); 
    } catch (error) {
      console.error("Error saving financial details:", error);
      toast.error(`Failed to update financial details: ${error.message || "An unexpected error occurred."}`); 
    }
  };

  useEffect(() => {
    if (userData) {
      setFormData({
        bank_name: userData.bank_name || "",
        bank_account_number: userData.bank_account_number || "",
        ifsc_code: userData.ifsc_code || "",
        voter_id: userData.voter_id || "",
        aadhaar_number: userData.aadhaar_number || "",
        pan_number: userData.pan_number || "",
      });
    }
  }, [userData, isOpen, setFormData]);

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Account and Government ID Details</h3>
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
        {["bank_name", "bank_account_number", "ifsc_code", "pan_number", "voter_id", "aadhaar_number"].map((key) => (
          <div key={key} className="break-words">
            <p className="text-gray-500 mb-1 capitalize">{key.replace(/_/g, " ")}</p>
            {/* Displaying data from userData prop for initial view */}
            <p className="text-gray-800 dark:text-white/90 font-medium">{userData[key] || "—"}</p>
          </div>
        ))}
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Edit Financial Details</h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Update your Bank and Goverment ID information below.</p>

          <form onSubmit={handleSubmit}>
            <div className="custom-scrollbar h-[300px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                {/* Bank Name */}
                <div>
                  <Label htmlFor="bank_name">Bank Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="bank_name"
                    name="bank_name"
                    value={formData?.bank_name}
                    onChange={handleChange}
                    required
                  />
                  {localErrors.bank_name && <p className="text-red-500 text-xs mt-1">{localErrors.bank_name}</p>}
                </div>

                {/* Account Number */}
                <div>
                  <Label htmlFor="bank_account_number">Account Number <span className="text-red-500">*</span></Label>
                  <Input
                    id="bank_account_number"
                    name="bank_account_number"
                    value={formData?.bank_account_number}
                    onChange={handleChange}
                    required
                    type="text"
                    pattern="[0-9]+" 
                    title="Please enter only numbers"
                  />
                  {localErrors.bank_account_number && <p className="text-red-500 text-xs mt-1">{localErrors.bank_account_number}</p>}
                </div>

                {/* IFSC Code */}
                <div>
                  <Label htmlFor="ifsc_code">IFSC Code <span className="text-red-500">*</span></Label>
                  <Input
                    id="ifsc_code"
                    name="ifsc_code"
                    value={formData?.ifsc_code}
                    onChange={handleChange}
                    required
                  />
                  {localErrors.ifsc_code && <p className="text-red-500 text-xs mt-1">{localErrors.ifsc_code}</p>}
                </div>

                {/* PAN Number */}
                <div>
                  <Label htmlFor="pan_number">PAN Number <span className="text-red-500">*</span></Label>
                  <Input
                    id="pan_number"
                    name="pan_number"
                    value={formData?.pan_number}       //e.g ABCDE1234F
                    onChange={(e) => handleChange({ 
                    target: {
                    name: e.target.name,
                    value: e.target.value.toUpperCase() 
                    }
                    }) }
                    required
                  />
                  {localErrors.pan_number && <p className="text-red-500 text-xs mt-1">{localErrors.pan_number}</p>}
                </div>

                {/* Aadhaar Number */}
                <div>
                  <Label htmlFor="aadhaar_number">Aadhaar Number <span className="text-red-500">*</span></Label>
                  <Input
                    id="aadhaar_number"
                    name="aadhaar_number"
                    value={formData?.aadhaar_number}
                    onChange={handleChange}
                    required
                    type="text" 
                    maxLength={12} 
                    pattern="[0-9]{12}" 
                    title="Please enter exactly 12 digits"
                  />
                  {localErrors.aadhaar_number && <p className="text-red-500 text-xs mt-1">{localErrors.aadhaar_number}</p>}
                </div>

                {/* Voter ID */}
                <div>
                  <Label htmlFor="voter_id">Voter ID <span className="text-red-500">*</span></Label>
                  <Input
                    id="voter_id"
                    name="voter_id"
                    value={formData?.voter_id}
                   onChange={(e) => handleChange({ 
                    target: {
                    name: e.target.name,
                    value: e.target.value.toUpperCase() 
                    }
                    }) }
                     required
                  />
                  {localErrors.voter_id && <p className="text-red-500 text-xs mt-1">{localErrors.voter_id}</p>}
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
          </form>
        </div>
      </Modal>
    </div>
  );
}