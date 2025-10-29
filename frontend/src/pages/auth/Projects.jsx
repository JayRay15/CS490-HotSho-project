import { useState, useRef } from "react";
import InputField from "../../components/InputField";

const STATUS = ["Completed", "Ongoing", "Planned"];
const SAMPLE_TECHS = ["React", "Node.js", "Python", "AWS", "Docker", "Postgres"];
const INDUSTRIES = ["Software", "Healthcare", "Finance", "Education", "Marketing", "Other"];

export default function ProjectModal({ isOpen, onClose, onSuccess, editingProject }) {
  const isEditMode = !!editingProject;
  
  const [form, setForm] = useState(editingProject || {
    name: "",
    description: "",
    role: "",
    startDate: "",
    endDate: "",
    technologies: "",
    projectUrl: "",
    teamSize: 1,
    collaboration: "",
    outcomes: "",
    industry: "",
    status: "Completed",
    screenshot: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const handleChange = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((s) => ({ ...s, [key]: value }));
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((s) => ({ ...s, screenshot: { name: file.name, data: reader.result } }));
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errors = [];
    
    if (!form.name.trim()) {
      errors.push("Project name is required");
    }
    if (!form.description.trim()) {
      errors.push("Description is required");
    }
    if (!form.role.trim()) {
      errors.push("Role is required");
    }
    if (!form.startDate) {
      errors.push("Start date is required");
    }
    
    return errors.length > 0 ? errors.join(', ') : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    try {
      // Get existing projects from localStorage
      const raw = localStorage.getItem('projects');
      const list = raw ? JSON.parse(raw) : [];
      
      let updatedList;
      let successMessage;
      
      if (isEditMode) {
        // Update existing project
        updatedList = list.map((p) => (p.id === editingProject.id ? { ...form, id: editingProject.id } : p));
        successMessage = `Project "${form.name}" updated successfully!`;
      } else {
        // Add new project
        const newProject = { ...form, id: Date.now() };
        updatedList = [newProject, ...list];
        successMessage = `Project "${form.name}" added successfully!`;
      }
      
      // Save to localStorage
      localStorage.setItem('projects', JSON.stringify(updatedList));
      
      // Call success callback with updated list
      onSuccess(updatedList, successMessage);
    } catch (err) {
      console.error("Error saving project:", err);
      setError("Failed to save project. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setForm({ name: "", description: "", role: "", startDate: "", endDate: "", technologies: "", projectUrl: "", teamSize: 1, collaboration: "", outcomes: "", industry: "", status: "Completed", screenshot: null });
    if (fileRef.current) fileRef.current.value = null;
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto relative border border-gray-200" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h3 className="text-2xl font-semibold">{isEditMode ? 'Edit Project' : 'Add Project'}</h3>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          <form id="project-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Project name" value={form.name} onChange={handleChange('name')} />
            <InputField label="Role" value={form.role} onChange={handleChange('role')} />

            <label className="block">
              <div className="mb-1 text-sm font-medium text-gray-700">Start date</div>
              <input type="date" value={form.startDate} onChange={handleChange('startDate')} className="w-full border rounded-md p-2" />
            </label>
            <label className="block">
              <div className="mb-1 text-sm font-medium text-gray-700">End date</div>
              <input type="date" value={form.endDate} onChange={handleChange('endDate')} className="w-full border rounded-md p-2" />
            </label>

            <label className="block md:col-span-2">
              <div className="mb-1 text-sm font-medium text-gray-700">Description</div>
              <textarea value={form.description} onChange={handleChange('description')} className="w-full border rounded-md p-2 min-h-[120px]" />
            </label>

            <label className="block md:col-span-2">
              <div className="mb-1 text-sm font-medium text-gray-700">Technologies (comma-separated)</div>
              <input value={form.technologies} onChange={handleChange('technologies')} className="w-full border rounded-md p-2" placeholder="React, Node.js, PostgreSQL" />
              <div className="text-xs text-gray-500 mt-1">Suggestions: {SAMPLE_TECHS.join(', ')}</div>
            </label>

            <InputField label="Project URL / Repo" value={form.projectUrl} onChange={handleChange('projectUrl')} />
            <label>
              <div className="mb-1 text-sm font-medium text-gray-700">Team size</div>
              <input type="number" min={1} value={form.teamSize} onChange={handleChange('teamSize')} className="w-40 border rounded-md p-2" />
            </label>

            <label className="block md:col-span-2">
              <div className="mb-1 text-sm font-medium text-gray-700">Collaboration / Team details</div>
              <input value={form.collaboration} onChange={handleChange('collaboration')} className="w-full border rounded-md p-2" />
            </label>

            <label className="block md:col-span-2">
              <div className="mb-1 text-sm font-medium text-gray-700">Outcomes & achievements</div>
              <textarea value={form.outcomes} onChange={handleChange('outcomes')} className="w-full border rounded-md p-2 min-h-[80px]" />
            </label>

            <label>
              <div className="mb-1 text-sm font-medium text-gray-700">Industry</div>
              <select value={form.industry} onChange={handleChange('industry')} className="w-full border rounded-md p-2">
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </label>

            <label>
              <div className="mb-1 text-sm font-medium text-gray-700">Status</div>
              <select value={form.status} onChange={handleChange('status')} className="w-full border rounded-md p-2">
                {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>

            <label className="block md:col-span-2">
              <div className="mb-1 text-sm font-medium text-gray-700">Upload screenshot</div>
              <div className="flex items-center gap-3">
                <input ref={fileRef} type="file" onChange={handleFile} className="hidden" />
                <button 
                  type="button" 
                  onClick={() => fileRef.current && fileRef.current.click()}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Choose File
                </button>
                <div className="text-sm text-gray-700">{form.screenshot ? form.screenshot.name : 'No file chosen'}</div>
              </div>
              {form.screenshot && <div className="mt-2"><img src={form.screenshot.data} alt={form.screenshot.name} className="max-h-40 rounded-md" /></div>}
            </label>
          </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className="px-6 py-2 border rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderColor: '#D1D5DB', color: '#374151' }}
                onMouseOver={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                onMouseOut={(e) => !isSaving && (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#777C6D' }}
                onMouseOver={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#656A5C')}
                onMouseOut={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#777C6D')}
              >
                {isSaving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Project' : 'Save Project')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
