import React, { useMemo } from 'react';
import ProjectCard from './ProjectCard';

function applyFilters(projects = [], filters = {}) {
  const { techs = [], industries = [], query = '', sort = 'dateDesc' } = filters;

  let out = projects.slice();

  if (query && query.trim()) {
    const q = query.toLowerCase();
    out = out.filter(p => (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q) || (p.technologies || []).join?.(',').toLowerCase().includes(q));
  }

  if (techs.length) {
    out = out.filter(p => {
      const t = Array.isArray(p.technologies) ? p.technologies : (p.technologies || '').split?.(',') || [];
      return techs.every(sel => t.map(x=>x.trim().toLowerCase()).includes(sel.toLowerCase()));
    });
  }

  if (industries.length) {
    out = out.filter(p => industries.includes(p.industry));
  }

  if (sort === 'dateDesc') {
    out.sort((a,b) => new Date(b.startDate || b.createdAt || 0) - new Date(a.startDate || a.createdAt || 0));
  } else if (sort === 'dateAsc') {
    out.sort((a,b) => new Date(a.startDate || a.createdAt || 0) - new Date(b.startDate || b.createdAt || 0));
  } else if (sort === 'custom') {
    // custom ordering: use numeric `order` or `customOrder` field if present
    out.sort((a,b) => (Number(a.order ?? a.customOrder ?? 0) - Number(b.order ?? b.customOrder ?? 0)));
  }

  return out;
}

export default function ProjectGrid({ projects = [], filters = {}, onOpenDetail, onEdit, onDelete }) {
  const visible = useMemo(() => applyFilters(projects, filters), [projects, filters]);

  if (!projects.length) return <div className="text-gray-600">No projects to show.</div>;

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      {visible.map(p => (
        <ProjectCard key={p._id || p.id || p.name} project={p} onOpenDetail={onOpenDetail} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
