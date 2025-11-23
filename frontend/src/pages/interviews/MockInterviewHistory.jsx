import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserMockInterviewSessions } from '../../api/mockInterviews';

export default function MockInterviewHistory() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSession, setExpandedSession] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getUserMockInterviewSessions();
        setSessions(res.data?.data || []);
      } catch (e) {
        setError(e?.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const toggleExpand = (sessionId) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  if (loading) return <div className="p-6">Loading your interview history...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Mock Interview History</h1>
        <button 
          onClick={() => navigate('/mock-interviews/start')} 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + New Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white shadow rounded p-8 text-center">
          <p className="text-gray-600 mb-4">No mock interview sessions yet.</p>
          <button 
            onClick={() => navigate('/mock-interviews/start')} 
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Start Your First Mock Interview
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const isExpanded = expandedSession === session._id;
            const hasResponses = session.responses?.length > 0;
            const isFinished = session.status === 'finished';
            
            return (
              <div key={session._id} className="bg-white shadow rounded overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-lg">
                        {session.roleTitle || 'Mock Interview'} 
                        {session.company && <span className="text-gray-600"> @ {session.company}</span>}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded ${isFinished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {isFinished ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>📅 {new Date(session.startedAt).toLocaleDateString()}</span>
                      {session.formats?.length > 0 && (
                        <span>📋 {session.formats.join(', ')}</span>
                      )}
                      {session.summary?.totalQuestions > 0 && (
                        <span>❓ {session.responses?.length || 0}/{session.summary.totalQuestions} answered</span>
                      )}
                      {session.summary?.averageWordCount > 0 && (
                        <span>📝 Avg {session.summary.averageWordCount} words</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {hasResponses && (
                      <button
                        onClick={() => toggleExpand(session._id)}
                        className="text-blue-600 hover:text-blue-800 px-3 py-1 text-sm border border-blue-600 rounded"
                      >
                        {isExpanded ? 'Hide Responses' : 'View Responses'}
                      </button>
                    )}
                    {isFinished && (
                      <button
                        onClick={() => navigate(`/mock-interviews/${session._id}`)}
                        className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700"
                      >
                        View Summary
                      </button>
                    )}
                    {!isFinished && (
                      <button
                        onClick={() => navigate(`/mock-interviews/${session._id}`)}
                        className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700"
                      >
                        Resume
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && hasResponses && (
                  <div className="border-t bg-gray-50 p-4">
                    <h4 className="font-medium mb-3 text-gray-700">Your Responses:</h4>
                    <div className="space-y-4">
                      {session.responses.map((response, idx) => (
                        <div key={idx} className="bg-white rounded p-4 border">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-sm text-gray-700">Question {idx + 1}</p>
                            <div className="flex gap-3 text-xs text-gray-500">
                              <span>📝 {response.wordCount || 0} words</span>
                              {response.durationSeconds > 0 && (
                                <span>⏱️ {Math.floor(response.durationSeconds / 60)}:{String(response.durationSeconds % 60).padStart(2, '0')}</span>
                              )}
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded p-3 mb-2">
                            <p className="text-sm whitespace-pre-wrap">{response.answer || '(No answer provided)'}</p>
                          </div>
                          {response.guidanceFeedback?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-600 mb-1">Feedback:</p>
                              <ul className="list-disc pl-5 space-y-1">
                                {response.guidanceFeedback.map((feedback, fIdx) => (
                                  <li key={fIdx} className="text-xs text-gray-600">{feedback}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
