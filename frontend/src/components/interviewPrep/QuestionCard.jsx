import React, { useState } from 'react';

export function QuestionCard({ q, onToggle }) {
  const [open, setOpen] = useState(false);
  const categoryColors = {
    Behavioral: 'bg-amber-100 text-amber-800',
    Technical: 'bg-blue-100 text-blue-800',
    Situational: 'bg-purple-100 text-purple-800'
  };
  const diffColors = {
    Easy: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Hard: 'bg-red-100 text-red-700'
  };
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-start gap-3">
        <div className="space-y-1 flex-1">
          <p className="font-medium text-gray-900 leading-relaxed">{q.text}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${categoryColors[q.category]}`}>{q.category}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${diffColors[q.difficulty]}`}>{q.difficulty}</span>
            {q.practiced && <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-600 text-white">Practiced</span>}
            {q.companyContext && <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{q.companyContext}</span>}
          </div>
          {q.linkedSkills?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {q.linkedSkills.slice(0,6).map(skill => (
                <span key={skill} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs">{skill}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => onToggle(q._id)}
            aria-pressed={q.practiced}
            className={`px-3 py-1 rounded text-xs font-medium transition ${q.practiced ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >{q.practiced ? 'Unmark' : 'Mark Practiced'}</button>
          {q.category === 'Behavioral' && q.starGuide && (
            <button onClick={() => setOpen(o => !o)} className="text-xs text-blue-600 hover:underline" aria-expanded={open}>{open ? 'Hide STAR' : 'Show STAR'}</button>
          )}
        </div>
      </div>
      {open && q.starGuide && (
        <div className="mt-3 border-t pt-3 grid gap-2 md:grid-cols-2">
          <StarItem label="Situation" text={q.starGuide.situation} />
          <StarItem label="Task" text={q.starGuide.task} />
          <StarItem label="Action" text={q.starGuide.action} />
          <StarItem label="Result" text={q.starGuide.result} />
        </div>
      )}
    </div>
  );
}

function StarItem({ label, text }) {
  return (
    <div className="bg-blue-50 rounded p-2">
      <p className="text-xs font-semibold text-blue-800 mb-1">{label}</p>
      <p className="text-xs text-blue-700 leading-snug">{text}</p>
    </div>
  );
}
