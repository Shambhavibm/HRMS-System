import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../pages/../components/ui/modal";
import Button from "../../pages/../components/ui/button/Button";
import Input from "../../pages/../components/form/input/Input";
import Label from "../../pages/../components/form/Label";
import SelectField from "../../pages/../components/form/input/SelectField";
import axios from "axios";
import { toast } from 'react-toastify';


// Generate years from 1950 to current year
const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => 1950 + i).sort((a, b) => b - a); // Sort descending

const educationFields = [
  { key: "aisce_board", label: "Board Name", mandatory: true, section: "aisce", title: "AISCE (10th) Details" },
  { key: "aisce_school", label: "School Name", mandatory: true, section: "aisce" },
  { key: "aisce_percentage", label: "Percentage", mandatory: true, section: "aisce" },
  { key: "aisce_year", label: "Passed Year", type: "year", mandatory: true, section: "aisce" },

  { key: "aissce_board", label: "Board Name", mandatory: true, section: "aissce", title: "AISSCE (PU) / Diploma Details" },
  { key: "aissce_college", label: "College Name", mandatory: true, section: "aissce" },
  { key: "aissce_stream", label: "Stream", mandatory: true, section: "aissce" },
  { key: "aissce_percentage", label: "Percentage", mandatory: true, section: "aissce" },
  { key: "aissce_year", label: "Passed Year", type: "year", mandatory: true, section: "aissce" },

  { key: "graduation_university", label: "University Name", mandatory: true, section: "graduation", title: "Graduation Details" },
  { key: "graduation_college", label: "College Name", mandatory: true, section: "graduation" },
  { key: "graduation_stream", label: "Stream", mandatory: true, section: "graduation" },
  { key: "graduation_percentage", label: "Percentage", mandatory: true, section: "graduation" },
  { key: "graduation_year", label: "Passed Year", type: "year", mandatory: true, section: "graduation" },

  // Optional fields from here onwards
  { key: "postgraduation_university", label: "University Name", mandatory: false, section: "postgraduation", title: "Post Graduation Details", isOptional: true },
  { key: "postgraduation_college", label: "College Name", mandatory: false, section: "postgraduation" },
  { key: "postgraduation_stream", label: "Stream", mandatory: false, section: "postgraduation" },
  { key: "postgraduation_percentage", label: "Percentage", mandatory: false, section: "postgraduation" },
  { key: "postgraduation_year", label: "Passed Year", type: "year", mandatory: false, section: "postgraduation" },

  { key: "doctorate_university", label: "University Name", mandatory: false, section: "doctorate", title: "Doctorate Details", isOptional: true },
  { key: "doctorate_college", label: "College Name", mandatory: false, section: "doctorate" },
  { key: "doctorate_stream", label: "Stream", mandatory: false, section: "doctorate" },
  { key: "doctorate_percentage", label: "Percentage", mandatory: false, section: "doctorate" },
  { key: "doctorate_year", type: "year", mandatory: false, section: "doctorate" },

  { key: "others_education_university", label: "University Name", mandatory: false, section: "others", title: "Other Education Details", isOptional: true },
  { key: "others_education_college", label: "College Name", mandatory: false, section: "others" },
  { key: "others_education_stream", label: "Stream", mandatory: false, section: "others" },
  { key: "others_education_percentage", label: "Percentage", mandatory: false, section: "others" },
  { key: "others_education_year", label: "Passed Year", type: "year", mandatory: false, section: "others" },
];

const defaultFormData = Object.fromEntries(educationFields.map(f => [f.key, ""]));

export default function EducationDetailsCard({ userData, refreshUserData }) {
  const { isOpen, openModal, closeModal } = useModal();
  const [formData, setFormData] = useState(defaultFormData);
  const [localErrors, setLocalErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const userId = userData?.user_id;
  const token = localStorage.getItem("token");

  // State to manage visibility of optional sections in the form
  const [showOptionalSections, setShowOptionalSections] = useState({
    postgraduation: false,
    doctorate: false,
    others: false,
  });

  const fetchEducationData = async () => {
    if (!userId || !token) {
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5001/api/user-education`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data) {
        const loadedData = { ...defaultFormData, ...res.data };
        setFormData(loadedData);

        // Based on loaded data, determine which optional sections should be open in the form
        const updatedShowOptionalSections = { ...showOptionalSections };
        if (Object.keys(loadedData).some(key => key.startsWith("postgraduation_") && loadedData[key])) {
          updatedShowOptionalSections.postgraduation = true;
        }
        if (Object.keys(loadedData).some(key => key.startsWith("doctorate_") && loadedData[key])) {
          updatedShowOptionalSections.doctorate = true;
        }
        if (Object.keys(loadedData).some(key => key.startsWith("others_education_") && loadedData[key])) {
          updatedShowOptionalSections.others = true;
        }
        setShowOptionalSections(updatedShowOptionalSections);

      } else {
        setFormData(defaultFormData);
        setShowOptionalSections({
          postgraduation: false,
          doctorate: false,
          others: false,
        });
      }
    } catch (err) {
      console.error("Error fetching education data:", err);
      toast.error("Failed to fetch education details.");
      setFormData(defaultFormData);
      setShowOptionalSections({
        postgraduation: false,
        doctorate: false,
        others: false,
      });
    }
  };

  useEffect(() => {
    fetchEducationData();
  }, [userId, token]);

  useEffect(() => {
    if (!isOpen) {
      setLocalErrors({});
      // Re-fetch data to ensure UI reflects latest state after modal close/save/cancel
      fetchEducationData();
    }
  }, [isOpen]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Validate all fields that are mandatory or part of an currently visible optional section
    educationFields.forEach(field => {
      const isOptionalSectionVisible = field.section && showOptionalSections[field.section];
      const shouldValidate = field.mandatory || isOptionalSectionVisible;

      if (shouldValidate && !formData[field.key]) {
        newErrors[field.key] = `${field.label} is required.`
        isValid = false;
      }
      if (field.type === "year" && formData[field.key] && isNaN(Number(formData[field.key]))) {
        newErrors[field.key] = `${field.label} must be a valid year.`;
        isValid = false;
      }
    });

    setLocalErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    setLoading(true);
    setLocalErrors({});

    try {
      const dataToSave = {};
      educationFields.forEach(field => {
        const isOptionalSectionVisible = field.section && showOptionalSections[field.section];
        // Only save fields that are part of a mandatory section, or an optional section that is visible,
        // or any field that has a value (even if its section is hidden, we keep the value if present)
        const shouldSave = field.mandatory || isOptionalSectionVisible || formData[field.key];
        if (shouldSave) {
          dataToSave[field.key] = formData[field.key];
        } else {
            // If an optional field/section is hidden/removed, explicitly set its value to empty
            // to clear it in the database on update
            dataToSave[field.key] = "";
        }
      });

      dataToSave.user_id = userId;
      dataToSave.organization_id = userData.organization_id;

      await axios.post(
        "http://localhost:5001/api/user-education",
        dataToSave,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Education details updated successfully!");
      closeModal();
      if (refreshUserData) await refreshUserData();
    } catch (err) {
      console.error("Error saving education:", err);
      toast.error(`Failed to save education details: ${err.response?.data?.message || err.message || "An unexpected error occurred."}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleOptionalSection = (sectionName) => {
    setShowOptionalSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
    // Clear relevant form data if section is being hidden
    if (showOptionalSections[sectionName]) {
      const fieldsToClear = educationFields.filter(field => field.section === sectionName);
      setFormData(prev => {
        const newFormData = { ...prev };
        fieldsToClear.forEach(field => {
          newFormData[field.key] = "";
        });
        return newFormData;
      });
      // clear errors for hidden fields
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        fieldsToClear.forEach(field => {
          delete newErrors[field.key];
        });
        return newErrors;
      });
    }
  };


  // Helper function to render the form fields within the modal
  const renderFormSectionFields = (sectionName, title, isOptional = false) => {
    const fields = educationFields.filter(field => field.section === sectionName);
    const isSectionVisible = !isOptional || showOptionalSections[sectionName];

    return (
      <div className="mb-6 border border-gray-200 p-4 rounded-md dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h5 className="text-lg font-semibold text-gray-700 dark:text-white">{title}</h5>
          {isOptional && (
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => toggleOptionalSection(sectionName)}
            >
              {showOptionalSections[sectionName] ? "Remove" : `Add ${title}`}
            </Button>
          )}
        </div>
        {isSectionVisible ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
            {fields.map(({ key, label, type, mandatory }) => (
              <div key={key}>
                <Label htmlFor={key}>{label} {mandatory && <span className="text-red-500">*</span>}</Label>
                {type === "year" ? (
                  <SelectField
                    id={key}
                    name={key}
                    value={formData[key] || ""}
                    onChange={handleChange}
                    options={years}
                    hasPlaceholder={true}
                    required={mandatory}
                  />
                ) : (
                  <Input
                    id={key}
                    name={key}
                    type="text"
                    value={formData[key]}
                    onChange={handleChange}
                    required={mandatory}
                  />
                )}
                {localErrors[key] && <p className="text-red-500 text-xs mt-1">{localErrors[key]}</p>}
              </div>
            ))}
          </div>
        ) : (
            isOptional && <p className="text-gray-500 text-sm italic">Click "Add {title}" to include this section.</p>
        )}
      </div>
    );
  };

  // Helper function to render an individual education display card
  const renderEducationDisplayCard = (sectionName, title, isOverviewCard = false) => {
    const fields = educationFields.filter(field => field.section === sectionName);
    const isAnyFieldPopulated = fields.some(field => formData[field.key]);
    const sectionConfig = educationFields.find(f => f.section === sectionName && f.title);
    const isOptional = sectionConfig?.isOptional;

    // Only render optional cards if they have data or were explicitly added
    if (isOptional && !isAnyFieldPopulated && !showOptionalSections[sectionName]) {
        return null;
    }

    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          {/* Main heading for the card */}
          {isOverviewCard ? (
            // For the combined overview card, show "Education Details Overview"
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Education Details Overview</h3>
          ) : (
            // For other individual cards, show their specific title as the main heading
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
          )}

          {/* Edit button, only shown for the overview card (which contains the edit modal for all) */}
          {isOverviewCard && (
            <button
              onClick={openModal} // This button opens the comprehensive modal
              className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.05470 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.63590 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.12620 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                />
              </svg>
              Edit
            </button>
          )}
        </div>

        {/* Horizontal line for the overview card */}
        {isOverviewCard && <hr className="mb-4 border-gray-200 dark:border-gray-700" />}

        {/* This is the sub-heading for specific education details within the card.
            - If it's the overview card AND specifically the AISCE section, show "AISCE (10th) Details".
            - Otherwise (for non-overview cards), show the 'title' passed, which acts as its main heading.
        */}
        {isOverviewCard && sectionName === "aisce" && (
            <h4 className="text-md font-semibold text-gray-700 dark:text-white mb-3">AISCE (10th) Details</h4>
        )}
        
        {/* For other individual cards (AISSCE, Graduation etc.), their main heading is already `<h3>{title}`.
            So we don't need a redundant `<h4>{title}` here for them.
            This `<h4>` should *only* appear for the AISCE section when it's the OVERVIEW card, to explicitly label its details.
            All other individual cards have their primary title in the `<h3>` already.
        */}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
          {fields.map(({ key, label }) => (
            <Field key={key} name={label} value={formData[key] || "—"} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="overall-container">
      {/* Display AISCE card with Overview title and Edit button */}
      {/* Pass true for isOverviewCard for the AISCE section to treat it as the combined overview */}
      {renderEducationDisplayCard("aisce", "AISCE (10th) Details", true)} 

      {/* Display Cards for Other Education Levels */}
      {renderEducationDisplayCard("aissce", "AISSCE (PU) / Diploma Details")}
      {renderEducationDisplayCard("graduation", "Graduation Details")}
      {renderEducationDisplayCard("postgraduation", "Post Graduation Details")}
      {renderEducationDisplayCard("doctorate", "Doctorate Details")}
      {renderEducationDisplayCard("others", "Other Education Details")}

      {/* Single Modal for Editing ALL Education Details */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Edit Education Details</h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Update your education information below.</p>

          <form onSubmit={handleSubmit}>
            <div className="custom-scrollbar h-[420px] overflow-y-auto px-2 pb-3">
              {/* Render ALL form sections within the modal */}
              {renderFormSectionFields("aisce", "AISCE (10th) Details")}
              {renderFormSectionFields("aissce", "AISSCE (PU) / Diploma Details")}
              {renderFormSectionFields("graduation", "Graduation Details")}
              {renderFormSectionFields("postgraduation", "Post Graduation Details", true)}
              {renderFormSectionFields("doctorate", "Doctorate Details", true)}
              {renderFormSectionFields("others", "Other Education Details", true)}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {localErrors.api && <p className="mt-3 text-sm text-red-600">{localErrors.api}</p>}
          </form>
        </div>
      </Modal>
    </div>
  );
}

// Re-using the Field component for display purposes
function Field({ name, value }) {
  return (
    <div className="flex flex-col">
      <p className="text-gray-500 mb-1 capitalize">{name}</p>
      <p className="text-gray-800 dark:text-white/90 font-medium break-all">{value || "—"}</p>
    </div>
  );
}