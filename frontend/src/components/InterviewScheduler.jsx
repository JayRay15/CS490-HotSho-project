import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Button from "./Button";
import InputField from "./InputField";
import { scheduleInterview, updateInterview, checkConflicts } from "../api/interviews";

const INTERVIEW_TYPES = [
  "Phone Screen",
  "Video Call", 
  "In-Person",
  "Technical",
  "Final Round",
  "Other"
];

export default function InterviewScheduler({ job, interview, onClose, onSuccess }) {
  const isEdit = !!interview;
  
  const [formData, setFormData] = useState({
    jobId: job?._id || interview?.jobId || "",
    title: interview?.title || `${job?.status || "Interview"} - ${job?.title || ""}`,
    company: interview?.company || job?.company || "",
    interviewType: interview?.interviewType || "Video Call",
    scheduledDate: interview?.scheduledDate 
      ? new Date(interview.scheduledDate).toISOString().slice(0, 16) 
      : "",
    duration: interview?.duration || 60,
    location: interview?.location || "",
    meetingLink: interview?.meetingLink || "",
    interviewer: {
      name: interview?.interviewer?.name || "",
      email: interview?.interviewer?.email || "",
      phone: interview?.interviewer?.phone || "",
      title: interview?.interviewer?.title || "",
      notes: interview?.interviewer?.notes || "",
    },
    notes: interview?.notes || "",
    questions: interview?.questions || [],
    requirements: {
      dressCode: interview?.requirements?.dressCode || "",
      documentsNeeded: interview?.requirements?.documentsNeeded || [],
      preparation: interview?.requirements?.preparation || [],
    },
    generateTasks: !isEdit,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conflicts, setConflicts] = useState([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [showInterviewerDetails, setShowInterviewerDetails] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  // Update form data when interview prop changes (for editing)
  useEffect(() => {
    if (interview) {
      // interview.jobId might be populated with job object or just ID
      const jobIdString = typeof interview.jobId === 'object' 
        ? interview.jobId._id 
        : interview.jobId;
      
      setFormData({
        jobId: jobIdString || job?._id || "",
        title: interview.title || "",
        company: interview.company || "",
        interviewType: interview.interviewType || "Video Call",
        scheduledDate: interview.scheduledDate 
          ? new Date(interview.scheduledDate).toISOString().slice(0, 16) 
          : "",
        duration: interview.duration || 60,
        location: interview.location || "",
        meetingLink: interview.meetingLink || "",
        interviewer: {
          name: interview.interviewer?.name || "",
          email: interview.interviewer?.email || "",
          phone: interview.interviewer?.phone || "",
          title: interview.interviewer?.title || "",
          notes: interview.interviewer?.notes || "",
        },
        notes: interview.notes || "",
        questions: interview.questions || [],
        requirements: {
          dressCode: interview.requirements?.dressCode || "",
          documentsNeeded: interview.requirements?.documentsNeeded || [],
          preparation: interview.requirements?.preparation || [],
        },
        generateTasks: false,
      });
    }
  }, [interview, job]);

  // Check for conflicts when date changes
  useEffect(() => {
    if (formData.scheduledDate) {
      checkForConflicts();
    }
  }, [formData.scheduledDate, formData.duration]);

  const checkForConflicts = async () => {
    if (!formData.scheduledDate) return;
    
    setCheckingConflicts(true);
    try {
      const response = await checkConflicts(
        formData.scheduledDate,
        formData.duration,
        interview?._id
      );
      
      if (response.data?.data?.hasConflicts) {
        setConflicts(response.data.data.conflicts);
      } else {
        setConflicts([]);
      }
    } catch (err) {
      console.error("Error checking conflicts:", err);
    } finally {
      setCheckingConflicts(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith("interviewer.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        interviewer: {
          ...prev.interviewer,
          [field]: value,
        },
      }));
    } else if (name.startsWith("requirements.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        requirements: {
          ...prev.requirements,
          [field]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error("Interview title is required");
      }
      if (!formData.company.trim()) {
        throw new Error("Company name is required");
      }
      if (!formData.scheduledDate) {
        throw new Error("Interview date and time is required");
      }
      if (!formData.interviewType) {
        throw new Error("Interview type is required");
      }

      // Check if date is in the past
      const selectedDate = new Date(formData.scheduledDate);
      if (selectedDate < new Date()) {
        throw new Error("Interview date cannot be in the past");
      }

      const submitData = {
        ...formData,
        scheduledDate: new Date(formData.scheduledDate).toISOString(),
      };

      let response;
      if (isEdit) {
        response = await updateInterview(interview._id, submitData);
      } else {
        response = await scheduleInterview(submitData);
      }

      if (response.data?.success) {
        onSuccess(response.data.data.interview);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to schedule interview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Edit Interview" : "Schedule Interview"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1">

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              <strong>⚠️ Scheduling Conflict:</strong> You have {conflicts.length} other interview(s) scheduled around this time.
              <ul className="mt-2 list-disc list-inside">
                {conflicts.map(c => (
                  <li key={c._id} className="text-sm">
                    {c.title} at {new Date(c.scheduledDate).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <InputField
              label="Interview Title *"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Technical Interview - Software Engineer"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Company *"
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Company name"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Type *
                </label>
                <select
                  name="interviewType"
                  value={formData.interviewType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  {INTERVIEW_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Date *
                </label>
                <input
                  type="date"
                  name="interviewDate"
                  value={formData.scheduledDate ? formData.scheduledDate.slice(0, 10) : ""}
                  onChange={(e) => {
                    const date = e.target.value;
                    const existingTime = formData.scheduledDate ? formData.scheduledDate.slice(11, 16) : "09:00";
                    setFormData(prev => ({
                      ...prev,
                      scheduledDate: date ? `${date}T${existingTime}` : ""
                    }));
                  }}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base cursor-pointer"
                  required
                  style={{ colorScheme: 'light' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Time *
                </label>
                <div className="flex space-x-2">
                  <select
                    value={(() => {
                      if (!formData.scheduledDate) return "09";
                      const time = formData.scheduledDate.slice(11, 16);
                      let hour = parseInt(time.split(':')[0]);
                      if (hour === 0) return "12";
                      if (hour > 12) return String(hour - 12).padStart(2, '0');
                      return String(hour).padStart(2, '0');
                    })()}
                    onChange={(e) => {
                      const date = formData.scheduledDate ? formData.scheduledDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
                      const minute = formData.scheduledDate ? formData.scheduledDate.slice(14, 16) : "00";
                      const existingTime = formData.scheduledDate ? formData.scheduledDate.slice(11, 16) : "09:00";
                      const existingHour = parseInt(existingTime.split(':')[0]);
                      const isPM = existingHour >= 12;
                      
                      let hour = parseInt(e.target.value);
                      if (isPM && hour !== 12) hour += 12;
                      if (!isPM && hour === 12) hour = 0;
                      
                      setFormData(prev => ({
                        ...prev,
                        scheduledDate: `${date}T${String(hour).padStart(2, '0')}:${minute}`
                      }));
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                      <option key={h} value={String(h).padStart(2, '0')}>
                        {String(h).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={formData.scheduledDate ? formData.scheduledDate.slice(14, 16) : "00"}
                    onChange={(e) => {
                      const date = formData.scheduledDate ? formData.scheduledDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
                      const hour = formData.scheduledDate ? formData.scheduledDate.slice(11, 13) : "09";
                      setFormData(prev => ({
                        ...prev,
                        scheduledDate: `${date}T${hour}:${e.target.value}`
                      }));
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {Array.from({ length: 60 }, (_, i) => i).map(m => (
                      <option key={m} value={String(m).padStart(2, '0')}>
                        {String(m).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={(() => {
                      if (!formData.scheduledDate) return "AM";
                      const hour = parseInt(formData.scheduledDate.slice(11, 13));
                      return hour >= 12 ? "PM" : "AM";
                    })()}
                    onChange={(e) => {
                      const date = formData.scheduledDate ? formData.scheduledDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
                      const minute = formData.scheduledDate ? formData.scheduledDate.slice(14, 16) : "00";
                      const existingTime = formData.scheduledDate ? formData.scheduledDate.slice(11, 16) : "09:00";
                      let hour = parseInt(existingTime.split(':')[0]);
                      
                      if (e.target.value === "PM") {
                        if (hour < 12) hour += 12;
                      } else {
                        if (hour >= 12) hour -= 12;
                      }
                      
                      setFormData(prev => ({
                        ...prev,
                        scheduledDate: `${date}T${String(hour).padStart(2, '0')}:${minute}`
                      }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="15"
                  max="480"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Location/Link - Show both fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Meeting Link (Optional)"
              type="url"
              name="meetingLink"
              value={formData.meetingLink}
              onChange={handleChange}
              placeholder="https://zoom.us/j/... or Google Meet link"
            />
            <InputField
              label="Location (Optional)"
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Office address or building/room"
            />
          </div>

          {/* Interviewer Details (Collapsible) */}
          <div>
            <button
              type="button"
              onClick={() => setShowInterviewerDetails(!showInterviewerDetails)}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <span className="mr-2">{showInterviewerDetails ? "▼" : "▶"}</span>
              Interviewer Details (Optional)
            </button>
            
            {showInterviewerDetails && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <InputField
                  label="Interviewer Name"
                  type="text"
                  name="interviewer.name"
                  value={formData.interviewer.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                />
                
                <InputField
                  label="Interviewer Title"
                  type="text"
                  name="interviewer.title"
                  value={formData.interviewer.title}
                  onChange={handleChange}
                  placeholder="Senior Engineer"
                />
                
                <InputField
                  label="Email"
                  type="email"
                  name="interviewer.email"
                  value={formData.interviewer.email}
                  onChange={handleChange}
                  placeholder="john@company.com"
                />
                
                <InputField
                  label="Phone"
                  type="tel"
                  name="interviewer.phone"
                  value={formData.interviewer.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Any additional notes about this interview..."
            />
          </div>

          {/* Generate Tasks Option (only for new interviews) */}
          {!isEdit && (
            <div className="flex items-center">
              <input
                type="checkbox"
                name="generateTasks"
                checked={formData.generateTasks}
                onChange={handleChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Automatically generate preparation tasks for this interview
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || checkingConflicts}
            >
              {loading ? "Saving..." : (isEdit ? "Update Interview" : "Schedule Interview")}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

InterviewScheduler.propTypes = {
  job: PropTypes.object,
  interview: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
