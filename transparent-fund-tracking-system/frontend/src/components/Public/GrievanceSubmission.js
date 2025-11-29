import React, { useState, useEffect } from "react";
import { submitGrievance } from "../../services/publicApi";
import { fetchPublicSchemes } from "../../services/publicApi";
import { usePublicAuth } from "../../context/PublicAuthContext";

const GrievanceSubmission = () => {
  const { user } = usePublicAuth();
  const [formData, setFormData] = useState({
    schemeId: "",
    schemeName: "",
    category: "other",
    title: "",
    description: "",
    location: "",
    beneficiaryName: "",
    contactEmail: "",
    contactPhone: "",
    submittedBy: user?.email || "anonymous"
  });
  const [documents, setDocuments] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const loadSchemes = async () => {
      try {
        const schemesList = await fetchPublicSchemes();
        setSchemes(schemesList);
      } catch (error) {
        console.error("Error loading schemes:", error);
      }
    };
    loadSchemes();
  }, []);

  // Update submittedBy when user changes
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        submittedBy: user.email,
        contactEmail: prev.contactEmail || user.email
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Auto-fill scheme name when scheme ID is selected
    if (name === "schemeId" && value) {
      const selectedScheme = schemes.find(s => s.id === Number(value));
      if (selectedScheme) {
        setFormData(prev => ({
          ...prev,
          schemeName: selectedScheme.name
        }));
      }
    }
  };

  const handleFileChange = (e) => {
    setDocuments(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category || !formData.title || !formData.description) {
      setMessage({ type: "error", text: "Please fill in all required fields!" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      // Append documents
      documents.forEach((file) => {
        submitData.append('documents', file);
      });

      const result = await submitGrievance(submitData);

      setMessage({
        type: "success",
        text: `✅ ${result.message || 'Grievance submitted successfully!'}\nGrievance ID: ${result.grievance?.grievanceId || ''}\nStatus: ${result.grievance?.status || 'pending'}`
      });

      // Reset form
      setFormData({
        schemeId: "",
        schemeName: "",
        category: "other",
        title: "",
        description: "",
        location: "",
        beneficiaryName: "",
        contactEmail: "",
        contactPhone: "",
        submittedBy: "anonymous"
      });
      setDocuments([]);
    } catch (error) {
      console.error("Error submitting grievance:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.error || error.message || "Failed to submit grievance"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-purple-700">Submit Grievance</h2>
      <p className="text-gray-600 mb-6">
        Report irregularities, fund misuse, delays, or corruption. Your identity will be kept confidential.
      </p>

      {message.text && (
        <div
          className={`p-4 mb-4 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-400"
              : "bg-red-100 text-red-800 border border-red-400"
          }`}
        >
          <pre className="whitespace-pre-wrap">{message.text}</pre>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="fund-misuse">Fund Misuse</option>
              <option value="irregularity">Irregularity</option>
              <option value="delay">Delay</option>
              <option value="corruption">Corruption</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scheme (Optional)
            </label>
            <select
              name="schemeId"
              value={formData.schemeId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select a scheme (optional)</option>
              {schemes.map((scheme) => (
                <option key={scheme.id} value={scheme.id}>
                  {scheme.name} (ID: {scheme.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Brief title of the grievance"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="5"
            placeholder="Provide detailed description of the issue..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, State"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beneficiary Name (Optional)
            </label>
            <input
              type="text"
              name="beneficiaryName"
              value={formData.beneficiaryName}
              onChange={handleChange}
              placeholder="Name of affected person"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email (Optional)
            </label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="your@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone (Optional)
            </label>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="+91 1234567890"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supporting Documents (Optional)
          </label>
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {documents.length > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              {documents.length} file(s) selected
            </p>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Your grievance will be reviewed by administrators. 
            You can track the status using your Grievance ID. Contact information is optional 
            but helps us follow up if needed.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Submit Grievance"}
        </button>
      </form>
    </div>
  );
};

export default GrievanceSubmission;

