import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSharedResume, listFeedbackForShare, postFeedbackForShare } from '../../api/resumeShare';

export default function SharedResumeView() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState(null);
  const [share, setShare] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const reviewerEmailHeader = authorEmail || null;

  const loadAll = async () => {
    try {
      setLoading(true);
      const res = await fetchSharedResume(token, reviewerEmailHeader);
      setResume(res.data.data.resume || res.data.resume || res.data.data);
      setShare(res.data.data.share || res.data.share || {});
      const fb = await listFeedbackForShare(token, reviewerEmailHeader);
      setFeedback(fb.data.data.feedback || fb.data.feedback || []);
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Failed to load shared resume';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await postFeedbackForShare(token, { comment, authorName, authorEmail }, reviewerEmailHeader);
      setComment('');
      const fb = await listFeedbackForShare(token, reviewerEmailHeader);
      setFeedback(fb.data.data.feedback || fb.data.feedback || []);
      setSuccess('Feedback submitted');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to submit feedback');
    }
  };

  if (loading) return <div className="p-6">Loading shared resume...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!resume) return <div className="p-6">Not found</div>;

  const sections = resume.sections || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">{resume.name}</h1>
        {sections.contactInfo && (
          <div className="mb-4 text-sm text-gray-700">
            <div><strong>{sections.contactInfo.name}</strong></div>
            {sections.contactInfo.location && <div>{sections.contactInfo.location}</div>}
            {sections.contactInfo.linkedin && <div><a className="text-blue-600" href={sections.contactInfo.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></div>}
            {sections.contactInfo.github && <div><a className="text-blue-600" href={sections.contactInfo.github} target="_blank" rel="noreferrer">GitHub</a></div>}
            {sections.contactInfo.website && <div><a className="text-blue-600" href={sections.contactInfo.website} target="_blank" rel="noreferrer">Website</a></div>}
          </div>
        )}
        {sections.summary && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Summary</h2>
            <p className="whitespace-pre-line">{sections.summary}</p>
          </div>
        )}
        {Array.isArray(sections.experience) && sections.experience.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Experience</h2>
            <div className="space-y-3">
              {sections.experience.map((e, i) => (
                <div key={i} className="bg-white p-4 rounded border">
                  <div className="font-medium">{e.jobTitle || e.title} @ {e.company}</div>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    {(e.bullets || []).map((b, bi) => <li key={bi}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
        {Array.isArray(sections.skills) && sections.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {sections.skills.map((s, i) => (
                <span key={i} className="px-2 py-1 text-sm bg-gray-200 rounded">{typeof s === 'string' ? s : s.name}</span>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Section */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">Feedback</h2>
          {success && <div className="mb-3 p-2 bg-green-100 text-green-800 rounded">{success}</div>}
          {share?.allowComments ? (
            <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <input type="text" className="border rounded p-2" placeholder="Your name" value={authorName} onChange={(e)=>setAuthorName(e.target.value)} />
                <input type="email" className="border rounded p-2" placeholder="Your email (required for private links)" value={authorEmail} onChange={(e)=>setAuthorEmail(e.target.value)} />
              </div>
              <textarea className="w-full border rounded p-2 mb-3" rows={4} placeholder="Leave your feedback..." value={comment} onChange={(e)=>setComment(e.target.value)} />
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Submit Feedback</button>
              {error && <div className="mt-2 text-red-600">{error}</div>}
            </form>
          ) : (
            <div className="p-3 bg-yellow-50 border rounded">Comments are disabled by the owner.</div>
          )}

          <div className="space-y-3">
            {feedback.map(f => (
              <div key={f._id} className="bg-white p-4 rounded border">
                <div className="text-sm text-gray-500 mb-1">{f.authorName || 'Anonymous'} {f.authorEmail ? `(${f.authorEmail})` : ''} • {new Date(f.createdAt).toLocaleString()}</div>
                <div>{f.comment}</div>
                {f.status === 'resolved' && (
                  <div className="mt-2 text-sm text-green-700">Resolved{f.resolutionNote ? `: ${f.resolutionNote}` : ''}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
