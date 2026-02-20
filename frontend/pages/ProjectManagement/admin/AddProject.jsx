

import { useEffect, useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/Input";
import Label from "../../../components/form/Label";
import SelectField from "../../../components/form/input/SelectField";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";

const statusOptions = ["Planned", "Active", "Completed"];

/**
 * Helper function to generate a project key preview from the project name.
 * This is a synchronous version for frontend display.
 * It does NOT check for uniqueness against the database.
 * @param {string} projectName - The full name of the project.
 * @returns {string} The generated project key preview.
 */
function generateProjectKeyPreview(projectName) {
  if (!projectName) return ''; // Return empty if no name

  let baseKey = projectName
    .split(/\s+/) // Split by one or more spaces
    .filter(word => word.length > 0) // Filter out empty strings from split
    .map(word => word.charAt(0)) // Get first letter of each word
    .join('') // Join them
    .toUpperCase(); // Convert to uppercase

  if (baseKey.length === 0) {
    baseKey = "PROJ"; // Default if name is just spaces or special chars
  } else if (baseKey.length > 5) { // Limit length for readability, e.g., max 5 chars
    baseKey = projectName.substring(0, 5).toUpperCase();
  }
  return baseKey;
}

export default function AddProject() {
  const [formData, setFormData] = useState({});
  const [nextProjectId, setNextProjectId] = useState(1);
  // State to hold the *preview* of the project key as user types
  const [projectKeyPreview, setProjectKeyPreview] = useState('');
  // State to hold the *final* generated project key after successful submission
  const [finalGeneratedProjectKey, setFinalGeneratedProjectKey] = useState('');


  useEffect(() => {
    const fetchNextProjectId = async () => {
      try {
        const response = await axios.get("/api/projects/next-id");
        setNextProjectId(response.data.nextId);
      } catch (err) {
        console.error("Failed to fetch next project ID", err);
      }
    };
    fetchNextProjectId();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // If the project_name field is being changed, update the key preview
    if (name === "project_name") {
      setProjectKeyPreview(generateProjectKeyPreview(value));
      // Clear final generated key when project name changes
      setFinalGeneratedProjectKey('');
    }
  };

  const handleDateChange = (date, field) => {
    const backendFormat = date
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      : "";
    setFormData((prev) => ({ ...prev, [field]: backendFormat }));
  };

  const getParsedDate = (value) => {
    if (!value) return null;
    return new Date(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { project_id: nextProjectId, ...formData };
      const response = await axios.post("/api/projects", payload);

      toast.success("Project added successfully!");
      // Set the final generated key from the backend response
      setFinalGeneratedProjectKey(response.data.project.project_key);
      // Clear the form data and preview for the next entry
      setFormData({});
      setProjectKeyPreview('');
      setNextProjectId((id) => id + 1); // Increment for next add
    } catch (error) {
      toast.error("Failed to add project. Please try again.");
      console.error("Error adding project:", error);
    }
  };

  const RequiredLabel = ({ htmlFor, children }) => (
    <Label htmlFor={htmlFor}>
      {children} <span className="text-red-500">*</span>
    </Label>
  );

  return (
    <>
      <PageMeta title="VipraGo | Add Project" description="Add new project information" />
      {/* <PageBreadcrumb pageTitle="Add Project" /> */}
      <ComponentCard >
        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl shadow">
            <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">Project Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="project_id">Project ID</Label>
                <Input id="project_id" name="project_id" value={nextProjectId} disabled />
              </div>
              <div>
                <RequiredLabel htmlFor="project_name">Project Name</RequiredLabel>
                <Input
                  id="project_name"
                  name="project_name"
                  value={formData.project_name || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              {/* Project Key Display Field */}
              <div>
                <Label htmlFor="project_key">Project Key</Label>
                <Input
                  id="project_key"
                  name="project_key"
                  // Display final generated key if available, else preview, else placeholder
                  value={finalGeneratedProjectKey || projectKeyPreview || "Auto-generated"}
                  disabled // Key is generated by backend, not user input
                  placeholder="Auto-generated after creation"
                />
              </div>
              <div className="md:col-span-2">
                <RequiredLabel htmlFor="description">Description</RequiredLabel>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  rows={3}
                  required
                  className="w-full border border-gray-300 rounded px-4 py-2 text-sm"
                />
              </div>
              {[
                ["discussion_date", "Discussion Date"],
                ["start_date", "Start Date"],
                ["implemented_date", "Implemented Date"],
                ["ongoing_status_date", "Ongoing Status Date"],
                ["end_date", "End Date"],
              ].map(([key, label]) => (
                <div key={key} >
                  <Label>{label}</Label>
                  <ReactDatePicker
                    selected={getParsedDate(formData[key])}
                    onChange={(date) => handleDateChange(date, key)}
                    dateFormat="dd-MM-yyyy"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    placeholderText="dd-mm-yyyy"
                    className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    wrapperClassName="w-full"
                  />
                </div>
              ))}
              <div>
                <RequiredLabel htmlFor="status">Status</RequiredLabel>
                <SelectField id="status" name="status" value={formData.status || ""} onChange={handleChange} options={statusOptions} hasPlaceholder />
              </div>
              <div className="md:col-span-2" >
                <RequiredLabel htmlFor="budget">Budget</RequiredLabel>
                <Input id="budget" name="budget" value={formData.budget || ""} onChange={handleChange} type="number" required />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl shadow">
            <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">Client Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <RequiredLabel htmlFor="client_name">Client Name</RequiredLabel>
                <Input id="client_name" name="client_name" value={formData.client_name || ""} onChange={handleChange} required />
              </div>
              <div>
                <RequiredLabel htmlFor="stakeholder_1">Primary Stakeholder Name</RequiredLabel>
                <Input id="stakeholder_1" name="stakeholder_1" value={formData.stakeholder_1 || ""} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="stakeholder_2">Secondary Stakeholder Name</Label>
                <Input id="stakeholder_2" name="stakeholder_2" value={formData.stakeholder_2 || ""} onChange={handleChange} />
              </div>
              <div>
                <RequiredLabel htmlFor="phone_number">Phone Number</RequiredLabel>
                <Input id="phone_number" name="phone_number" value={formData.phone_number || ""} onChange={handleChange} required/>
              </div>
              <div>
                <RequiredLabel htmlFor="email">Email</RequiredLabel>
                <Input id="email" name="email" value={formData.email || ""} onChange={handleChange} required/>
              </div>
              <div>
                <RequiredLabel htmlFor="website">Website Link</RequiredLabel>
                <Input id="website" name="website" value={formData.website || ""} onChange={handleChange} required/>
              </div>
              <div>
                <RequiredLabel htmlFor="client_address">Address</RequiredLabel>
                <Input id="client_address" name="client_address" value={formData.client_address || ""} onChange={handleChange} required />
              </div>
              <div>
                <RequiredLabel htmlFor="city">City</RequiredLabel>
                <Input id="city" name="city" value={formData.city || ""} onChange={handleChange} required/>
              </div>
              <div>
                <RequiredLabel htmlFor="state">State</RequiredLabel>
                <Input id="state" name="state" value={formData.state || ""} onChange={handleChange} required />
              </div>
              <div>
                <RequiredLabel htmlFor="country">Country</RequiredLabel>
                <Input id="country" name="country" value={formData.country || ""} onChange={handleChange} required />
              </div>
              <div className="md:col-span-2">
                <RequiredLabel htmlFor="zipcode">Zip Code</RequiredLabel>
                <Input id="zipcode" name="zipcode" value={formData.zipcode || ""} onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Add Project</Button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
