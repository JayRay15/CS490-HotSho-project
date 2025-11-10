import { useEffect, useState } from "react";
import Button from "./Button";
import api from "../api/axios";

export default function MaterialsCompare({ onClose, getToken }) {
  const [tab, setTab] = useState('resume'); // 'resume' or 'coverLetter'
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const resp = await api.get('/api/materials/list');
        setResumes(resp.data.data.resumes || []);
        setCoverLetters(resp.data.data.coverLetters || []);
      } catch (e) {
        console.error('Failed to load materials list', e);
        setError('Failed to load materials list');
      }
    })();
  }, []);

  const handleCompare = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const token = await getToken();
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (tab === 'resume') {
        // Backend expects resumeId2 as the query param name
        const resp = await api.get(`/api/resume/resumes/${a}/compare`, { params: { resumeId2: b } });
        setResult(resp.data.data || resp.data);
      } else {
        const resp = await api.get(`/api/cover-letters/${a}/compare`, { params: { otherId: b } });
        setResult(resp.data.data || resp.data);
      }
    } catch (e) {
      console.error('Compare failed', e);
      setError(e.response?.data?.message || 'Compare failed');
    } finally {
      setLoading(false);
    }
  };

  // Simple token-level diff highlighter
  const TextDiff = ({ a = "", b = "" }) => {
    const at = (a || "").split(/(\s+)/);
    const bt = (b || "").split(/(\s+)/);
    const aset = new Set(at);
    const bset = new Set(bt);
    return (
      <div className="text-sm leading-relaxed">
        <div className="mb-2">
          {at.map((tok, i) => {
            if (tok.trim() === "") return <span key={`a-${i}`}>{tok}</span>;
            if (!bset.has(tok)) return <span key={`a-${i}`} className="bg-red-100 text-red-800 rounded px-0.5">{tok}</span>;
            return <span key={`a-${i}`}>{tok}</span>;
          })}
        </div>
        <div>
          {bt.map((tok, i) => {
            if (tok.trim() === "") return <span key={`b-${i}`}>{tok}</span>;
            if (!aset.has(tok)) return <span key={`b-${i}`} className="bg-green-100 text-green-800 rounded px-0.5">{tok}</span>;
            return <span key={`b-${i}`}>{tok}</span>;
          })}
        </div>
      </div>
    );
  };

  const renderCoverLetterDiff = (data) => {
    const diff = data?.diff || [];
    const nameA = data?.a?.name || "Version A";
    const nameB = data?.b?.name || "Version B";
    if (!diff.length) return <p className="text-gray-600">No differences.</p>;
    return (
      <div className="space-y-4">
        {diff.map((d, idx) => {
          const leftLines = (d.onlyInA || []).map((line, i) => (<div key={`la-${i}`} className="bg-red-50 text-red-900 px-2 py-0.5 rounded">{line}</div>));
          const rightLines = (d.onlyInB || []).map((line, i) => (<div key={`lb-${i}`} className="bg-green-50 text-green-900 px-2 py-0.5 rounded">{line}</div>));
          return (
            <div key={idx} className="border rounded">
              <div className="px-3 py-2 border-b bg-gray-50 text-sm font-medium text-gray-700">Section: {d.section}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Only in {nameA}</div>
                  <div className="space-y-1">{leftLines.length ? leftLines : <div className="text-gray-500">No unique lines</div>}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Only in {nameB}</div>
                  <div className="space-y-1">{rightLines.length ? rightLines : <div className="text-gray-500">No unique lines</div>}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderResumeDiff = (data) => {
    const cmp = data?.comparison || {};
    const r1 = cmp.resume1 || {};
    const r2 = cmp.resume2 || {};
    const diffs = cmp.differences || {};
    const full = cmp.fullData || {};
    const nameA = r1.name || "Version A";
    const nameB = r2.name || "Version B";

    const countRow = (label, aCount, bCount) => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center p-2 border-b">
        <div className="text-sm text-gray-600">{label}</div>
        <div className={`px-2 py-1 rounded text-sm ${aCount !== bCount ? 'bg-yellow-50 text-yellow-900' : 'bg-gray-50 text-gray-800'}`}>{aCount ?? '-'}</div>
        <div className={`px-2 py-1 rounded text-sm ${aCount !== bCount ? 'bg-yellow-50 text-yellow-900' : 'bg-gray-50 text-gray-800'}`}>{bCount ?? '-'}</div>
      </div>
    );

    return (
      <div className="border rounded overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 bg-gray-50 border-b">
          <div className="p-2 text-xs text-gray-500">Field</div>
          <div className="p-2 text-xs font-medium text-gray-700">{nameA}</div>
          <div className="p-2 text-xs font-medium text-gray-700">{nameB}</div>
        </div>
        {/* Summary text */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start p-2 border-b">
          <div className="text-sm text-gray-600">Summary</div>
          <div className="text-sm bg-gray-50 rounded p-2">
            <TextDiff a={full?.resume1?.summary || ''} b={full?.resume2?.summary || ''} />
          </div>
          <div className="text-sm bg-gray-50 rounded p-2">
            {/* Show the same diff component so both sides show respective adds/removes */}
            <TextDiff a={full?.resume1?.summary || ''} b={full?.resume2?.summary || ''} />
          </div>
        </div>

        {/* Counts */}
        {countRow('Experience count', diffs?.experienceCount?.resume1, diffs?.experienceCount?.resume2)}
        {countRow('Skills count', diffs?.skillsCount?.resume1, diffs?.skillsCount?.resume2)}
        {countRow('Education count', diffs?.educationCount?.resume1, diffs?.educationCount?.resume2)}
        {countRow('Projects count', diffs?.projectsCount?.resume1, diffs?.projectsCount?.resume2)}

        {/* Section customization boolean */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center p-2">
          <div className="text-sm text-gray-600">Section customization</div>
          <div className={`px-2 py-1 rounded text-xs ${diffs?.sectionCustomization ? 'bg-yellow-50 text-yellow-900' : 'bg-gray-50 text-gray-800'}`}>{diffs?.sectionCustomization ? 'Different' : 'Same'}</div>
          <div className={`px-2 py-1 rounded text-xs ${diffs?.sectionCustomization ? 'bg-yellow-50 text-yellow-900' : 'bg-gray-50 text-gray-800'}`}>{diffs?.sectionCustomization ? 'Different' : 'Same'}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Compare Materials</h2>
          <div className="flex gap-2 mb-4">
            <button className={`px-3 py-1 rounded ${tab==='resume'?'bg-blue-600 text-white':'bg-gray-100 text-gray-800'}`} onClick={()=>setTab('resume')}>Resumes</button>
            <button className={`px-3 py-1 rounded ${tab==='coverLetter'?'bg-blue-600 text-white':'bg-gray-100 text-gray-800'}`} onClick={()=>setTab('coverLetter')}>Cover Letters</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Version A</label>
              <select value={a} onChange={(e)=>setA(e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="">Select...</option>
                {(tab==='resume'?resumes:coverLetters).map((m)=> (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Version B</label>
              <select value={b} onChange={(e)=>setB(e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="">Select...</option>
                {(tab==='resume'?resumes:coverLetters).map((m)=> (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button variant="primary" onClick={handleCompare} disabled={!a || !b || loading}>{loading? 'Comparing…' : 'Compare'}</Button>
          </div>

          {error && <p className="text-red-700 mt-4">{error}</p>}
          {result && (
            <div className="mt-4">
              {tab === 'coverLetter' ? (
                renderCoverLetterDiff(result)
              ) : (
                renderResumeDiff(result)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
