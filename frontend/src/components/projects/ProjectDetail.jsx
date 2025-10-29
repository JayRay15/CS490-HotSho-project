import React, { useEffect, useState } from 'react';

export default function ProjectDetail({ project, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!project) return null;

  const handlePrint = () => {
    // open a new window with a printable view and good print CSS
    const techsHtml = (project.technologies || []).map(t => `<span class="tech">${t}</span>`).join(' ');
    const imgHtml = project.screenshot?.data ? `<div class="screenshot"><img src="${project.screenshot.data}" alt="${project.name}" /></div>` : '';

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${project.name} - Summary</title>
          <style>
            @page { margin: 20mm; }
            body { font-family: Inter, Arial, Helvetica, sans-serif; color: #111827; padding: 0; margin: 0; }
            .container { max-width: 800px; margin: 0 auto; padding: 24px; }
            h1 { font-size: 24px; margin-bottom: 6px; }
            .meta { color: #6B7280; margin-bottom: 12px; }
            .description { margin-top: 12px; font-size: 14px; line-height: 1.45; }
            .tech { display: inline-block; margin: 4px 6px 0 0; padding: 6px 8px; background: #F3F4F6; border-radius: 6px; font-size: 12px; color: #374151; }
            .screenshot img { max-width: 100%; height: auto; border-radius: 6px; margin-bottom: 12px; }
            .section { margin-top: 18px; }
            .role { font-weight: 600; color: #374151; }
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .container { padding: 0; }
              button, .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${project.name}</h1>
            <div class="meta">${project.industry || ''} ${project.industry ? '•' : ''} ${project.startDate || ''}${project.startDate && project.endDate ? ' — ' : ''}${project.endDate || ''}</div>
            ${imgHtml}
            <div class="section description">${project.description || ''}</div>
            <div class="section">
              <div class="role">Role</div>
              <div class="description">${project.role || ''}</div>
            </div>
            ${project.outcomes ? `<div class="section"><div class="role">Outcomes</div><div class="description">${project.outcomes}</div></div>` : ''}
            <div class="section">
              <div class="role">Technologies</div>
              <div style="margin-top:8px">${techsHtml}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    const w = window.open('', '_blank');
    if (!w) { alert('Unable to open print window'); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    // delay a bit to let images load
    setTimeout(() => { try { w.print(); } catch (e) { console.error('Print failed', e); } }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-6 overflow-auto">
      <div className="bg-white rounded max-w-3xl w-full shadow-lg">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-semibold">{project.name}</h3>
          <div className="flex items-center gap-2">
            <ShareInDetail project={project} />
            <button onClick={handlePrint} className="px-3 py-1 bg-slate-700 text-white rounded text-sm">Print</button>
            <button onClick={onClose} className="px-3 py-1 border rounded text-sm">Close</button>
          </div>
        </div>

        <div className="p-6">
          {project.screenshot?.data && <img src={project.screenshot.data} alt={project.name} className="w-full max-h-64 object-cover rounded mb-4" />}

          <div className="text-sm text-gray-600 mb-2">{project.industry} • {project.startDate} — {project.endDate}</div>

          <div className="prose max-w-none">{project.description}</div>

          <div className="mt-4">
            <h4 className="font-medium">Technologies</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {(project.technologies || []).map((t,i) => (
                <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded">{t}</span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-medium">Role & Outcomes</h4>
            <div className="text-sm text-gray-700 mt-2">{project.role}</div>
            {project.outcomes && <div className="mt-2 text-sm text-gray-700">{project.outcomes}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareInDetail({ project }) {
  const [copied, setCopied] = useState(false);
  const id = project._id || project.id || project.uuid;
  const url = `${window.location.origin}/projects/${id}`;

  const copy = async (e) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
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
    <button onClick={copy} className="px-3 py-1 border rounded text-sm" title="Copy shareable link">
      {copied ? 'Copied' : 'Share'}
    </button>
  );
}
