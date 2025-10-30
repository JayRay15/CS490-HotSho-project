import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ProjectCard({ project, onOpenDetail, onEdit, onDelete }) {
  const start = project.startDate ? new Date(project.startDate).toLocaleDateString() : '';
  const end = project.endDate ? new Date(project.endDate).toLocaleDateString() : '';

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm hover:shadow-md transition-all" style={{ minWidth: 220 }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {project.screenshot?.data ? (
            <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-50 flex-shrink-0">
              <img src={project.screenshot.data} alt={project.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7a5 5 0 0110 0" /></svg>
            </div>
          )}

          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
            <div className="text-sm text-gray-600 mt-1 truncate">{project.role || '—'}</div>
            <div className="text-xs text-gray-500 mt-2">{start}{start && end ? ' — ' : ''}{end}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {onEdit && (
            <button onClick={() => onEdit(project)} className="p-2 text-gray-600 hover:text-blue-600 rounded-md" title="Edit project">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(project)} className="p-2 text-gray-600 hover:text-red-600 rounded-md" title="Delete project">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          )}
          {/* Share / copy link button */}
          <ShareButton project={project} />
        </div>
      </div>

      <div className="mt-4">
        <button onClick={() => onOpenDetail && onOpenDetail(project)} className="text-sm text-white bg-slate-800 hover:bg-slate-900 px-3 py-2 rounded-md shadow-sm">View</button>
      </div>
    </div>
  );
}

function ShareButton({ project }) {
  const [copied, setCopied] = useState(false);
  const id = project._id || project.id || project.uuid;
  const url = `${window.location.origin}/projects/${id}`;

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
      alert('Failed to copy link');
    }
  };

  return (
    <button onClick={handleCopy} title="Copy shareable link" className="p-2 text-gray-600 hover:text-green-600 rounded-md">
      {copied ? (
        <span className="text-xs text-green-600">Copied</span>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3h8a2 2 0 012 2v2" /></svg>
      )}
    </button>
  );
}
