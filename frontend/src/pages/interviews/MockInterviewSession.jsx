import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMockInterviewSession, answerMockInterviewQuestion, finishMockInterviewSession } from '../../api/mockInterviews';

export default function MockInterviewSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const questionStartRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Load draft from localStorage for current question
  const loadDraft = (sessionObj) => {
    if (!sessionObj) return;
    const q = sessionObj.questions[sessionObj.currentIndex];
    if (!q) return;
    const key = `mockDraft_${sessionObj._id}_${q._id}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      setAnswer(raw);
    } else {
      setAnswer('');
    }
  };

  const fetchSession = async () => {
    setLoading(true); setError(null);
    try {
      const res = await getMockInterviewSession(sessionId);
      const data = res.data?.data;
      setSession(data);
      questionStartRef.current = Date.now();
      setElapsed(0);
      loadDraft(data);
    } catch(e) {
      setError(e?.response?.data?.message || e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchSession(); }, [sessionId]);

  const currentQuestion = session && session.questions[session.currentIndex];

  // Timer interval
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const diff = Math.round((now - questionStartRef.current)/1000);
      setElapsed(diff);
    }, 1000);
    return () => clearInterval(id);
  }, [session?.currentIndex]);

  // Persist draft
  useEffect(() => {
    const q = currentQuestion;
    if (!session || !q) return;
    const key = `mockDraft_${session._id}_${q._id}`;
    localStorage.setItem(key, answer);
  }, [answer, session, currentQuestion]);

  const handleSubmit = async () => {
    if (!currentQuestion) return;
    setSubmitting(true); setError(null);
    try {
      const durationSeconds = Math.round((Date.now() - questionStartRef.current)/1000);
      const res = await answerMockInterviewQuestion(session._id, { answer, durationSeconds });
      const updated = res.data?.data;
      setSession(updated);
      // Clear draft for previous question
      const prevKey = `mockDraft_${session._id}_${currentQuestion._id}`;
      localStorage.removeItem(prevKey);
      questionStartRef.current = Date.now();
      setElapsed(0);
      setAnswer('');
      loadDraft(updated);
    } catch(e) {
      setError(e?.response?.data?.message || e.message);
    } finally { setSubmitting(false); }
  };

  const handleFinish = async () => {
    setSubmitting(true); setError(null);
    try {
      const res = await finishMockInterviewSession(session._id);
      setSession(res.data?.data);
    } catch(e) { setError(e?.response?.data?.message || e.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="p-6">Loading session...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!session) return <div className="p-6">Session not found.</div>;

  if (session.status === 'finished') {
    const summary = session.summary || {};
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Mock Interview Summary</h1>
        <p className="text-gray-600 mb-4">Role: {session.roleTitle || 'N/A'} | Company: {session.company || 'N/A'}</p>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white shadow rounded p-4">
            <p className="text-sm text-gray-500">Total Questions</p>
            <p className="text-xl font-semibold">{summary.totalQuestions}</p>
          </div>
          <div className="bg-white shadow rounded p-4">
            <p className="text-sm text-gray-500">Avg Word Count</p>
            <p className="text-xl font-semibold">{summary.averageWordCount}</p>
          </div>
          <div className="bg-white shadow rounded p-4">
            <p className="text-sm text-gray-500">Avg Duration (s)</p>
            <p className="text-xl font-semibold">{summary.averageDurationSeconds}</p>
          </div>
        </div>
        <div className="bg-white shadow rounded p-4 mb-6">
          <h2 className="text-lg font-medium mb-2">Improvement Areas</h2>
          {summary.improvementAreas?.length ? (
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {summary.improvementAreas.map((i,idx)=><li key={idx}>{i}</li>)}
            </ul>
          ) : <p className="text-sm text-gray-500">None detected. Great work!</p>}
        </div>
        <div className="bg-white shadow rounded p-4 mb-6">
          <h2 className="text-lg font-medium mb-2">Confidence Exercises</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {(summary.confidenceExercises||[]).map((e,idx)=><li key={idx}>{e}</li>)}
          </ul>
        </div>
        <button onClick={()=>navigate('/dashboard')} className="bg-blue-600 text-white px-4 py-2 rounded">Return to Dashboard</button>
      </div>
    );
  }

  // Progress bar for pacing
  const pacing = currentQuestion?.pacingSeconds || 0;
  const progressPct = pacing ? Math.min(100, Math.round((elapsed / pacing) * 100)) : 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Mock Interview Session</h1>
      <p className="text-gray-600 mb-4">Role: {session.roleTitle || 'N/A'} | Company: {session.company || 'N/A'}</p>
      <div className="bg-white shadow rounded p-4 mb-6">
        <p className="text-sm text-gray-500 mb-1">Question {session.currentIndex + 1} of {session.questions.length}</p>
        <h2 className="text-lg font-medium mb-3">{currentQuestion?.text}</h2>
        {currentQuestion && (
          <div className="text-xs text-gray-500 mb-3 flex items-center justify-between">
            <span>Ideal length: {currentQuestion.idealWordRange.min}-{currentQuestion.idealWordRange.max} words · Recommended pacing: {Math.round(currentQuestion.pacingSeconds/60*10)/10} min</span>
            <span className="ml-4">Elapsed: {elapsed}s</span>
          </div>
        )}
        {pacing > 0 && (
          <div className="h-2 bg-gray-200 rounded mb-3 overflow-hidden" aria-label="Pacing progress">
            <div className={`h-full transition-all duration-500 ${progressPct < 70 ? 'bg-green-500' : progressPct < 100 ? 'bg-yellow-500' : 'bg-red-600'}`} style={{ width: `${progressPct}%` }} />
          </div>
        )}
        <textarea 
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          rows={8} 
          className="w-full border rounded px-3 py-2 text-sm mb-4" 
          placeholder="Type your answer here..." 
        />
        <div className="flex flex-wrap gap-3">
          <button 
            disabled={submitting || !answer.trim()} 
            onClick={handleSubmit} 
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Answer'}
          </button>
          <button 
            disabled={submitting} 
            onClick={handleFinish} 
            className="bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Finish Early
          </button>
        </div>
        {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
      </div>
    </div>
  );
}
