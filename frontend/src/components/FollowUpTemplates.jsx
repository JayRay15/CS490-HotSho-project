import React, { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import api, { setAuthToken } from "../api/axios";

const TEMPLATE_TYPES = {
  THANK_YOU: "thank-you",
  STATUS_INQUIRY: "status-inquiry",
  FEEDBACK_REQUEST: "feedback-request",
  NETWORKING: "networking",
};

const TIMING_SUGGESTIONS = {
  "thank-you": { hours: 24, description: "Send within 24 hours after interview" },
  "status-inquiry": { days: 7, description: "Wait 7-10 days after interview before status check" },
  "feedback-request": { days: 14, description: "Request feedback 2 weeks after final decision" },
  "networking": { days: 3, description: "Reach out within 3-5 days after rejection" },
};

function generateTemplate(type, job, interviewDetails = {}, userName = "[Your Name]") {
  const { 
    interviewer = {}, 
    interviewDate = null, 
    specificTopics = [], 
    companyProjects = [],
    interviewNotes = ""
  } = interviewDetails;

  const interviewerName = interviewer.name || "Hiring Manager";
  const company = job.company || "the company";
  const role = job.title || "the position";
  
  const templates = {
    "thank-you": {
      subject: `Thank You - ${role} Interview`,
      body: `Dear ${interviewerName},

Thank you for taking the time to speak with me ${interviewDate ? `on ${new Date(interviewDate + 'T12:00:00').toLocaleDateString()}` : 'recently'} about the ${role} position at ${company}. I truly enjoyed our conversation and learning more about ${companyProjects.length > 0 ? companyProjects[0] : 'the team\'s work'}.

${specificTopics.length > 0 ? `I was particularly excited to discuss ${specificTopics.join(', ')}. ${specificTopics.length === 1 ? 'This aligns' : 'These align'} perfectly with my experience and passion.` : 'Our discussion about the role\'s challenges and opportunities reinforced my enthusiasm for this position.'}

${interviewNotes ? `\n${interviewNotes}\n` : ''}
I'm very interested in contributing to ${company}'s mission and believe my skills would be a strong fit for your team. Please let me know if you need any additional information from me.

Thank you again for your time and consideration. I look forward to hearing from you.

Best regards,
${userName}`,
    },
    "status-inquiry": {
      subject: `Follow-up Regarding ${role} Application`,
      body: `Dear ${interviewerName},

I hope this email finds you well. I wanted to follow up on my application for the ${role} position at ${company}${interviewDate ? `, which we discussed on ${new Date(interviewDate).toLocaleDateString()}` : ''}.

I remain very interested in this opportunity and am excited about the possibility of joining your team. ${specificTopics.length > 0 ? `Our conversation about ${specificTopics[0]} particularly resonated with me.` : ''}

I understand that hiring processes take time, and I wanted to check if there are any updates on the position or if you need any additional information from me.

Thank you for your time and consideration. I look forward to hearing from you.

Best regards,
${userName}`,
    },
    "feedback-request": {
      subject: `Interview Feedback Request - ${role}`,
      body: `Dear ${interviewerName},

Thank you again for the opportunity to interview for the ${role} position at ${company}. While I'm disappointed not to be moving forward, I greatly appreciated the experience.

I'm committed to continuous improvement in my career, and I would be very grateful if you could share any feedback from the interview process. Understanding areas where I could strengthen my skills or presentation would be invaluable for my professional development.

I recognize that providing feedback takes time, so I appreciate any insights you're able to share. Even high-level comments would be helpful.

Thank you again for your time and consideration.

Best regards,
${userName}`,
    },
    "networking": {
      subject: `Staying Connected - ${company}`,
      body: `Dear ${interviewerName},

Thank you for taking the time to speak with me about the ${role} position at ${company}. While I understand the position has moved in a different direction, I truly valued our conversation${specificTopics.length > 0 ? `, especially discussing ${specificTopics[0]}` : ''}.

I'm very impressed by ${company}'s work and mission, and I'd love to stay connected for potential future opportunities. I'm also happy to be a resource if I can ever be helpful to you or your team.

Would you be open to connecting on LinkedIn? I'd enjoy staying in touch and following ${company}'s continued success.

Thank you again for your time and consideration.

Best regards,
${userName}`,
    },
  };

  return templates[type] || templates["thank-you"];
}

export default function FollowUpTemplates({ job, onClose }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.fullName || '[Your Name]' : '[Your Name]';
  const [templateType, setTemplateType] = useState(TEMPLATE_TYPES.THANK_YOU);
  const [template, setTemplate] = useState({ subject: "", body: "" });
  const [interviewDetails, setInterviewDetails] = useState({
    interviewer: { name: "" },
    interviewDate: "",
    specificTopics: [],
    companyProjects: [],
    interviewNotes: job?.interviewNotes || "",
  });
  const [topicInput, setTopicInput] = useState("");
  const [projectInput, setProjectInput] = useState("");
  const [followUps, setFollowUps] = useState([]);
  const [statistics, setStatistics] = useState({ sent: 0, responded: 0, responseRate: 0 });
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [expandedFollowUp, setExpandedFollowUp] = useState(null);

  useEffect(() => {
    if (job) {
      loadFollowUps();
      loadStatistics();
    }
  }, [job]);

  useEffect(() => {
    const generated = generateTemplate(templateType, job, interviewDetails, userName);
    setTemplate(generated);
  }, [templateType, job, interviewDetails, userName]);

  const loadFollowUps = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      const response = await api.get(`/api/follow-ups/${job._id}`);
      setFollowUps(response.data.data || []);
    } catch (error) {
      console.error("Failed to load follow-ups:", error);
    }
  };

  const loadStatistics = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      const response = await api.get(`/api/follow-ups/stats/${job._id}`);
      setStatistics(response.data.data || { sent: 0, responded: 0, responseRate: 0 });
    } catch (error) {
      console.error("Failed to load statistics:", error);
    }
  };

  const handleAddTopic = () => {
    if (topicInput.trim()) {
      setInterviewDetails(prev => ({
        ...prev,
        specificTopics: [...prev.specificTopics, topicInput.trim()]
      }));
      setTopicInput("");
    }
  };

  const handleAddProject = () => {
    if (projectInput.trim()) {
      setInterviewDetails(prev => ({
        ...prev,
        companyProjects: [...prev.companyProjects, projectInput.trim()]
      }));
      setProjectInput("");
    }
  };

  const handleRemoveTopic = (index) => {
    setInterviewDetails(prev => ({
      ...prev,
      specificTopics: prev.specificTopics.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveProject = (index) => {
    setInterviewDetails(prev => ({
      ...prev,
      companyProjects: prev.companyProjects.filter((_, i) => i !== index)
    }));
  };

  const handleCopyToClipboard = async () => {
    try {
      const fullText = `Subject: ${template.subject}\n\n${template.body}`;
      await navigator.clipboard.writeText(fullText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("Failed to copy to clipboard");
    }
  };

  const handleSendFollowUp = async () => {
    // Check if interviewer email is provided
    if (!interviewDetails.interviewer?.email) {
      const proceed = window.confirm(
        "No interviewer email address provided. The follow-up will be recorded but no email will be sent.\n\n" +
        "Would you like to continue? You can still copy the template and send it manually."
      );
      if (!proceed) return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);
      
      const response = await api.post("/api/follow-ups", {
        jobId: job._id,
        templateType,
        subject: template.subject,
        body: template.body,
        interviewDetails,
      });

      const emailSent = response.data?.data?.emailSent;
      const emailError = response.data?.data?.emailError;
      
      if (emailSent) {
        setSendSuccess(true);
        setTimeout(() => setSendSuccess(false), 5000);
      } else if (emailError) {
        alert(`Follow-up recorded but email failed to send: ${emailError}\n\nYou can copy the template and send it manually.`);
      } else if (!interviewDetails.interviewer?.email) {
        alert("Follow-up recorded. No email was sent because no interviewer email was provided.\n\nYou can copy the template and send it manually.");
      } else {
        alert("Follow-up recorded. Email sending is not configured.\n\nYou can copy the template and send it manually.");
      }

      await loadFollowUps();
      await loadStatistics();
    } catch (error) {
      console.error("Failed to send follow-up:", error);
      alert(error.response?.data?.message || "Failed to send follow-up");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkResponse = async (followUpId, received) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      await api.put(`/api/follow-ups/${followUpId}/response`, { received });
      await loadFollowUps();
      await loadStatistics();
    } catch (error) {
      console.error("Failed to update response:", error);
      alert("Failed to update response status");
    }
  };

  const timingSuggestion = TIMING_SUGGESTIONS[templateType];

  return (
    <div className="follow-up-templates">
      {/* Header - matches Add Job modal style */}
      <div className="bg-gray-50 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-heading font-semibold text-gray-900">Interview Follow-Up Templates</h3>
            <p className="text-sm text-gray-600 mt-1">{job.title} at {job.company}{job.location && ` • ${job.location}`}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content area with padding */}
      <div className="p-6">

      {/* Statistics */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 grid grid-cols-3 gap-4 border border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">{statistics.sent}</div>
          <div className="text-sm text-gray-600">Sent</div>
        </div>
        <div className="text-center border-l border-r border-gray-200">
          <div className="text-2xl font-bold text-gray-800">{statistics.responded}</div>
          <div className="text-sm text-gray-600">Responded</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">{statistics.responseRate}%</div>
          <div className="text-sm text-gray-600">Response Rate</div>
        </div>
      </div>

      {/* Template Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Template Type</label>
        <select
          value={templateType}
          onChange={(e) => setTemplateType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={TEMPLATE_TYPES.THANK_YOU}>Thank You Email</option>
          <option value={TEMPLATE_TYPES.STATUS_INQUIRY}>Status Inquiry</option>
          <option value={TEMPLATE_TYPES.FEEDBACK_REQUEST}>Feedback Request</option>
          {job.status === 'Rejected' && (
            <option value={TEMPLATE_TYPES.NETWORKING}>Networking Follow-Up</option>
          )}
        </select>
        
        {/* Timing Suggestion */}
        {timingSuggestion && (
          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-start">
            <span className="text-gray-600 mr-2">⏰</span>
            <div className="text-sm text-gray-700">
              <strong>Timing Suggestion:</strong> {timingSuggestion.description}
            </div>
          </div>
        )}
      </div>

      {/* Interview Details */}
      <div className="mb-6 space-y-4">
        <h3 className="text-sm font-medium text-gray-800">Personalization Details</h3>
        
        {/* Interviewer Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Interviewer Name</label>
          <input
            type="text"
            value={interviewDetails.interviewer.name}
            onChange={(e) => setInterviewDetails(prev => ({
              ...prev,
              interviewer: { ...prev.interviewer, name: e.target.value }
            }))}
            placeholder="e.g., Sarah Johnson"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Interviewer Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Interviewer Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={interviewDetails.interviewer.email || ''}
            onChange={(e) => setInterviewDetails(prev => ({
              ...prev,
              interviewer: { ...prev.interviewer, email: e.target.value }
            }))}
            placeholder="e.g., sarah.johnson@company.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Required to send email. For demo purposes, you can use a test email address.
          </p>
        </div>

        {/* Interview Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Interview Date</label>
          <input
            type="date"
            value={interviewDetails.interviewDate}
            onChange={(e) => setInterviewDetails(prev => ({
              ...prev,
              interviewDate: e.target.value
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Specific Topics */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specific Topics Discussed</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
              placeholder="e.g., microservices architecture"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddTopic}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {interviewDetails.specificTopics.map((topic, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm border border-gray-200"
              >
                {topic}
                <button
                  onClick={() => handleRemoveTopic(index)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Company Projects */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Projects Mentioned</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={projectInput}
              onChange={(e) => setProjectInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddProject()}
              placeholder="e.g., new payment system"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddProject}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {interviewDetails.companyProjects.map((project, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm border border-gray-200"
              >
                {project}
                <button
                  onClick={() => handleRemoveProject(index)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
          <textarea
            value={interviewDetails.interviewNotes}
            onChange={(e) => setInterviewDetails(prev => ({
              ...prev,
              interviewNotes: e.target.value
            }))}
            placeholder="Add any additional context or points you want to include..."
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Generated Template */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Generated Template</h3>
        
        {/* Subject */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input
            type="text"
            value={template.subject}
            onChange={(e) => setTemplate(prev => ({ ...prev, subject: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
          <textarea
            value={template.body}
            onChange={(e) => setTemplate(prev => ({ ...prev, body: e.target.value }))}
            rows="12"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6 pt-4 border-t border-gray-200">
        <button
          onClick={handleCopyToClipboard}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition border border-gray-300"
        >
          {copySuccess ? "✓ Copied!" : "Copy to Clipboard"}
        </button>
        <button
          onClick={handleSendFollowUp}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50"
        >
          {loading ? "Sending..." : sendSuccess ? "✓ Email Sent!" : "Send Follow-Up Email"}
        </button>
      </div>

      {/* Follow-Up History */}
      {followUps.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Follow-Up History</h3>
          <div className="space-y-3">
            {followUps.map((followUp) => (
              <div
                key={followUp._id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setExpandedFollowUp(expandedFollowUp === followUp._id ? null : followUp._id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{followUp.subject}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(followUp.sentAt).toLocaleDateString()} at{" "}
                      {new Date(followUp.sentAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {followUp.emailSent !== undefined && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        followUp.emailSent
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`} title={followUp.emailError ? `Email error: ${followUp.emailError}` : ''}>
                        {followUp.emailSent ? "📧 Sent" : "📝 Recorded"}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      followUp.responseReceived
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {followUp.responseReceived ? "Responded" : "Pending"}
                    </span>
                    <span className="text-gray-400">
                      {expandedFollowUp === followUp._id ? "▼" : "▶"}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Type: <span className="font-medium capitalize">{followUp.templateType.replace('-', ' ')}</span>
                </div>
                
                {/* Expanded content */}
                {expandedFollowUp === followUp._id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Subject:</div>
                      <div className="text-sm text-gray-900 mb-4">{followUp.subject}</div>
                      
                      <div className="text-sm font-medium text-gray-700 mb-2">Message:</div>
                      <div className="text-sm text-gray-900 whitespace-pre-wrap">{followUp.body}</div>
                      
                      {followUp.interviewDetails?.interviewer?.name && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">Interview Details:</div>
                          <div className="text-sm text-gray-600">
                            <div>Interviewer: {followUp.interviewDetails.interviewer.name}</div>
                            {followUp.interviewDetails.interviewer.email && (
                              <div>Email: {followUp.interviewDetails.interviewer.email}</div>
                            )}
                            {followUp.interviewDetails.interviewDate && (
                              <div>Date: {new Date(followUp.interviewDetails.interviewDate).toLocaleDateString()}</div>
                            )}
                            {followUp.interviewDetails.specificTopics?.length > 0 && (
                              <div>Topics: {followUp.interviewDetails.specificTopics.join(', ')}</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {followUp.emailError && (
                        <div className="mt-4 pt-4 border-t border-red-200">
                          <div className="text-sm font-medium text-red-700 mb-2">⚠️ Email Error:</div>
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {followUp.emailError}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            The follow-up was recorded but the email could not be sent. You can copy the template above and send it manually.
                          </div>
                        </div>
                      )}
                      
                      {followUp.emailSent === false && !followUp.emailError && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            ℹ️ Email was not sent (SMTP not configured or no interviewer email provided). You can copy the template above and send it manually.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="mt-3">
                  {!followUp.responseReceived ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkResponse(followUp._id, true);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Mark as Responded
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkResponse(followUp._id, false);
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Mark as Not Responded
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
