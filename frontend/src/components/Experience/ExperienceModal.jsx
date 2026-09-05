/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import "./experience.css";
import AppDatePicker from "../AppDatePicker/AppDatePicker";
import CustomSelect from "../CustomSelect/CustomSelect";

function Spinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function ExperienceModal({ editData, onSave, onClose, loading }) {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    employmentType: "Full-time",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (editData) {
      setFormData({
        title: editData.title || "",
        company: editData.company || "",
        employmentType: editData.employmentType || "Full-time",
        location: editData.location || "",
        startDate: editData.startDate ? new Date(editData.startDate).toISOString().split("T")[0] : "",
        endDate: editData.endDate ? new Date(editData.endDate).toISOString().split("T")[0] : "",
        isCurrent: Boolean(editData.isCurrent),
        description: editData.description || "",
      });
    }
  }, [editData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Job title is required";
    if (!formData.company.trim()) newErrors.company = "Company name is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.isCurrent && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = "End date cannot be earlier than start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
  };

  return (
    <div className="exp-modal-overlay" onClick={onClose}>
      <div className="exp-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="exp-modal-header">
          <h3>{editData ? "Edit Experience" : "Add Work Experience"}</h3>
          <button type="button" className="exp-close-btn" onClick={onClose} disabled={loading}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="exp-modal-form">
          <div className="exp-form-group">
            <label className="exp-label">Job Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Senior Software Engineer"
              className={`exp-input ${errors.title ? "error" : ""}`}
              disabled={loading}
            />
            {errors.title && <span className="exp-error-msg">{errors.title}</span>}
          </div>

          <div className="exp-form-group">
            <label className="exp-label">Company Name *</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="e.g. Google / Microsoft"
              className={`exp-input ${errors.company ? "error" : ""}`}
              disabled={loading}
            />
            {errors.company && <span className="exp-error-msg">{errors.company}</span>}
          </div>

          <div className="exp-form-row">
            <div className="exp-form-group">
              <label className="exp-label">Employment Type</label>
              <CustomSelect
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                disabled={loading}
                placeholder="Select Employment Type"
                options={[
                  { label: "Full-time", value: "Full-time" },
                  { label: "Part-time", value: "Part-time" },
                  { label: "Contract", value: "Contract" },
                  { label: "Internship", value: "Internship" },
                  { label: "Freelance", value: "Freelance" },
                ]}
              />
            </div>

            <div className="exp-form-group">
              <label className="exp-label">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Mumbai, India or Remote"
                className="exp-input"
                disabled={loading}
              />
            </div>
          </div>

          <div className="exp-checkbox-group">
            <label className="exp-checkbox-label">
              <input
                type="checkbox"
                name="isCurrent"
                checked={formData.isCurrent}
                onChange={handleChange}
                disabled={loading}
              />
              <span>I currently work in this role</span>
            </label>
          </div>

          <div className="exp-form-row">
            <div className="exp-form-group">
              <label className="exp-label">Start Date *</label>
              <AppDatePicker
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                disabled={loading}
                maxDate={new Date()}
                placeholderText="Select start date"
                error={!!errors.startDate}
                inputClassName="exp-input"
              />
              {errors.startDate && <span className="exp-error-msg">{errors.startDate}</span>}
            </div>

            {!formData.isCurrent && (
              <div className="exp-form-group">
                <label className="exp-label">End Date</label>
                <AppDatePicker
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  disabled={loading}
                  maxDate={new Date()}
                  minDate={formData.startDate ? new Date(formData.startDate + "T00:00:00") : undefined}
                  placeholderText="Select end date"
                  error={!!errors.endDate}
                  inputClassName="exp-input"
                />
                {errors.endDate && <span className="exp-error-msg">{errors.endDate}</span>}
              </div>
            )}
          </div>

          <div className="exp-form-group">
            <label className="exp-label">Description / Key Responsibilities</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Describe your responsibilities, projects, and achievements..."
              className="exp-input exp-textarea"
              disabled={loading}
            />
          </div>

          <div className="exp-modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><Spinner /> Saving...</> : editData ? "Update Experience" : "Add Experience"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExperienceModal;
