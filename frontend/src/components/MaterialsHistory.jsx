import { useEffect, useState } from "react";
import Button from "./Button";
import api from "../api/axios";

export default function MaterialsHistory({ job, onClose, getToken }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = await getToken();
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const resp = await api.get(`/api/materials/jobs/${job._id}/history`);
        setHistory(resp.data.data.history || []);
      } catch (e) {
        console.error('Failed to load materials history', e);
        alert('Failed to load materials history');
        onClose?.();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Materials History</h2>
          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-gray-600">No history yet.</p>
          ) : (
            <div className="space-y-3">
              {[...history].reverse().map((h, idx) => (
                <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-0">
                  <div className="shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        Resume: {h.resume?.name || 'None'} | Cover Letter: {h.coverLetter?.name || 'None'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}
                      </span>
                    </div>
                    {h.reason && (
                      <p className="text-sm text-gray-600 mt-1">{h.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
