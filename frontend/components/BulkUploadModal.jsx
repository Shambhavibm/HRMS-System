import React, { useState } from "react";
import axios from "axios";
import { Modal } from "./ui/modal";
import Button from "./ui/button/Button";
import Input from "./form/input/Input";
import Label from "./form/Label";
import { toast } from 'react-toastify';
import Papa from "papaparse";

export default function BulkUploadModal({ isOpen, onClose, onUploaded }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith(".csv")) {
      setSelectedFile(file);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.errors.length) {
            toast.error("CSV has parsing errors.");
            setPreviewData([]);
          } else {
            setPreviewData(result.data.slice(0, 10));
          }
        },
      });
    } else {
      setSelectedFile(null);
      setPreviewData([]);
      toast.error("Please select a valid CSV file.");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return toast.error("No file selected.");

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post("/api/calendar-events/bulk-upload-events", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success(res.data.message || "Events uploaded successfully");
      setPreviewData([]);
      setSelectedFile(null);
      onUploaded();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to upload events.";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl m-4">
      <div className="relative w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Bulk Upload Events (CSV)
        </h4>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Upload a CSV file with columns:
          <br />
          <code>title, description, start_date, end_date, type, scope</code>
        </p>

        <Label htmlFor="csvFile">Select CSV File <span className="text-red-500">*</span></Label>
        <Input id="csvFile" type="file" accept=".csv" onChange={handleFileChange} />

        {previewData.length > 0 && (
          <div className="mt-4 max-h-64 overflow-auto border rounded-md">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200 border">
              <thead className="bg-gray-100 dark:bg-gray-700 text-xs font-semibold">
                <tr>
                  {Object.keys(previewData[0]).map((key) => (
                    <th key={key} className="px-3 py-2 border">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i} className="border-b">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-3 py-2 border">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs mt-1 text-gray-500">Showing first {previewData.length} rows</p>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button size="sm" variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleUpload} disabled={uploading || !selectedFile}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
