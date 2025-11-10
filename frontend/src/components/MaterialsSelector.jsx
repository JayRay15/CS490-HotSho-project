import { useEffect, useState } from "react";
import Button from "./Button";
import api from "../api/axios";

export default function MaterialsSelector({ job, onClose, onLinked, getToken }) {
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [selectedResume, setSelectedResume] = useState(job?.materials?.resume?._id || job?.materials?.resume || "");
  const [selectedCoverLetter, setSelectedCoverLetter] = useState(job?.materials?.coverLetter?._id || job?.materials?.coverLetter || "");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = await getToken();
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const resp = await api.get('/api/materials/list');
        setResumes(resp.data.data.resumes || []);
        setCoverLetters(resp.data.data.coverLetters || []);
        // Preselect defaults if job has no selections
        if (!(job?.materials?.resume) && (resp.data.data.resumes || []).length) {
          const def = (resp.data.data.resumes || []).find(r => r.isDefault);
          if (def) setSelectedResume(def._id);
        }
        if (!(job?.materials?.coverLetter) && (resp.data.data.coverLetters || []).length) {
          const defc = (resp.data.data.coverLetters || []).find(c => c.isDefault);
          if (defc) setSelectedCoverLetter(defc._id);
        }
      } catch (e) {
        console.error('Failed to load materials', e);
        alert('Failed to load materials list');
        onClose?.();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      const token = await getToken();
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await api.post(`/api/materials/jobs/${job._id}/link`, {
        resumeId: selectedResume || null,
        coverLetterId: selectedCoverLetter || null,
        reason: reason || undefined,
      });
      onLinked?.();
      onClose?.();
    } catch (e) {
      console.error('Failed to link materials', e);
      alert(e.response?.data?.message || 'Failed to link materials');
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Select Materials</h2>
          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
                <select
                  value={selectedResume}
                  onChange={(e) => setSelectedResume(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">None</option>
                  {resumes.map(r => (
                    <option key={r._id} value={r._id}>{r.name}{r.isDefault ? ' (Default)' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter</label>
                <select
                  value={selectedCoverLetter}
                  onChange={(e) => setSelectedCoverLetter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">None</option>
                  {coverLetters.map(c => (
                    <option key={c._id} value={c._id}>{c.name}{c.isDefault ? ' (Default)' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Tailored for data science role"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleSave}>Save</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
