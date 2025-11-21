import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useInterviewQuestionBank } from '../hooks/useInterviewQuestionBank.js';
import { QuestionFilters } from '../components/interviewPrep/QuestionFilters.jsx';
import { QuestionCard } from '../components/interviewPrep/QuestionCard.jsx';
import { StatsPanel } from '../components/interviewPrep/StatsPanel.jsx';
import { getJob } from '../api/jobs.js';

export default function InterviewPrepPage() {
  const { jobId } = useParams();
  const { bank, loading, error, filteredQuestions, filters, setFilters, generateBank, togglePractice } = useInterviewQuestionBank(jobId);
  const [jobMeta, setJobMeta] = useState(null);
  const [jobMetaError, setJobMetaError] = useState(null);

  useEffect(() => {
    let active = true;
    if (jobId) {
      getJob(jobId)
        .then(res => {
          const job = res.data?.data?.job || res.data?.job;
          if (active) setJobMeta(job || null);
        })
        .catch(() => active && setJobMetaError('Could not load job details'));
    }
    return () => { active = false; };
  }, [jobId]);

  const headerSubtitle = jobMeta
    ? `${jobMeta.title || 'Job'}${jobMeta.company ? ' @ ' + jobMeta.company : ''}`
    : '';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interview Prep</h1>
          {headerSubtitle && <p className="text-sm text-gray-600">{headerSubtitle}</p>}
          {!bank && jobMetaError && <p className="text-xs text-red-600">{jobMetaError}</p>}
        </div>
        <div className="flex gap-2">
          {bank && <button onClick={generateBank} disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">Regenerate Bank</button>}
          {!bank && <button onClick={generateBank} disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">Generate Bank</button>}
          {bank && <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-3 py-2 rounded bg-gray-200 text-gray-700 text-sm hover:bg-gray-300">Top</button>}
        </div>
      </header>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
      {loading && <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">Loading...</div>}
      {!loading && !bank && !error && (
        <div className="p-6 border border-dashed rounded-lg text-center text-gray-600 bg-white">
          <p className="mb-2">No question bank yet for this job.</p>
          <p className="text-xs">Click "Generate Bank" to create curated questions.</p>
        </div>
      )}
      {bank && (
        <div className="space-y-6">
          <StatsPanel stats={bank.stats} />
          <section>
            <QuestionFilters filters={filters} setFilters={setFilters} />
            <div className="grid gap-4">
              {filteredQuestions.length === 0 && <p className="text-sm text-gray-500">No questions match current filters.</p>}
              {filteredQuestions.map(q => (
                <QuestionCard key={q._id} q={q} onToggle={togglePractice} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
