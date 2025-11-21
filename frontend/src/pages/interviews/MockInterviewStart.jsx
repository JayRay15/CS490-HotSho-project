import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { startMockInterview } from '../../api/mockInterviews';
import { getJobs } from '../../api/jobs';

export default function MockInterviewStart() {
  const navigate = useNavigate();
  const [roleTitle, setRoleTitle] = useState('Software Engineer');
  const [company, setCompany] = useState('Sample Company');
  const [jobId, setJobId] = useState('');
  const [jobs, setJobs] = useState([]);
    // Fetch jobs for selection
    useEffect(() => {
      let mounted = true;
      getJobs().then(res => {
        if (!mounted) return;
        const list = res.data?.data?.jobs;
        setJobs(Array.isArray(list) ? list : []);
      }).catch(() => {
        if (mounted) setJobs([]);
      });
      return () => { mounted = false; };
    }, []);

    const handleSelectJob = (e) => {
      const id = e.target.value;
      setJobId(id);
      if (!id) return;
      const job = jobs.find(j => j._id === id);
      if (job) {
        setRoleTitle(job.title || roleTitle);
        setCompany(job.company || company);
      }
    };
  const [formats, setFormats] = useState(['Behavioral','Technical','Case']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleFormat = (fmt) => {
    setFormats(prev => prev.includes(fmt) ? prev.filter(f => f!==fmt) : [...prev, fmt]);
  };

  const handleStart = async () => {
    setLoading(true); setError(null);
    try {
      const payload = { roleTitle, company, formats };
      if (jobId) payload.jobId = jobId;
      const res = await startMockInterview(payload);
              <div>
                <label className="block text-sm font-medium">Select Existing Job (optional)</label>
                <select value={jobId} onChange={handleSelectJob} className="mt-1 w-full border rounded px-3 py-2 text-sm">
                  <option value="">-- None / Custom Role --</option>
                  {Array.isArray(jobs) && jobs.map(j => (
                    <option key={j._id} value={j._id}>{j.title}{j.company ? ` @ ${j.company}` : ''}</option>
                  ))}
                </select>
                {jobId && <p className="text-xs text-gray-500 mt-1">Role & Company auto-filled from selected job. You can still edit.</p>}
              </div>
      const sessionId = res.data?.data?._id;
      if (sessionId) navigate(`/mock-interviews/${sessionId}`);
      else setError('Failed to create session');
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Start Mock Interview</h1>
      <div className="space-y-4 bg-white shadow rounded p-4">
        <div>
          <label className="block text-sm font-medium">Target Role</label>
          <input value={roleTitle} onChange={e=>setRoleTitle(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Company</label>
          <input value={company} onChange={e=>setCompany(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Formats</label>
          {['Behavioral','Technical','Case'].map(f => (
            <label key={f} className="flex items-center space-x-2 mb-1">
              <input type="checkbox" checked={formats.includes(f)} onChange={()=>toggleFormat(f)} />
              <span>{f}</span>
            </label>
          ))}
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button disabled={loading} onClick={handleStart} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading? 'Starting...' : 'Begin Session'}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-4">You will answer questions sequentially and receive a performance summary at the end.</p>
    </div>
  );
}
