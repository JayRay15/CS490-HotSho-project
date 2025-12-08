import React from 'react';

export default function ProjectFilters({ techOptions = [], industryOptions = [], filters = {}, onChange }) {
  const update = (patch) => onChange({ ...filters, ...patch });

  const toggleTech = (tech) => {
    const set = new Set(filters.techs || []);
    if (set.has(tech)) set.delete(tech); else set.add(tech);
    update({ techs: Array.from(set) });
  };

  const toggleIndustry = (industry) => {
    const set = new Set(filters.industries || []);
    if (set.has(industry)) set.delete(industry); else set.add(industry);
    update({ industries: Array.from(set) });
  };

  return (
    <div className="bg-white border p-4 rounded-md">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex-1">
          <input
            value={filters.query || ''}
            onChange={(e) => update({ query: e.target.value })}
            placeholder="Search projects..."
            className="w-full border rounded p-2"
          />
        </div>

        <div className="flex items-center gap-3">
          <select value={filters.sort || 'dateDesc'} onChange={(e) => update({ sort: e.target.value })} className="border rounded p-2">
            <option value="dateDesc">Newest</option>
            <option value="dateAsc">Oldest</option>
            <option value="relevance">Relevance</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-sm font-medium mb-2">Technologies</div>
        <div className="flex flex-wrap gap-2">
          {techOptions.length ? techOptions.map(t => (
            <button
              key={t}
              onClick={() => toggleTech(t)}
              className={`text-sm px-2 py-1 rounded border ${ (filters.techs || []).includes(t) ? 'bg-[#656A5C] text-white' : 'bg-white text-gray-700' }`}
            >{t}</button>
          )) : <div className="text-xs text-gray-500">No techs</div>}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-sm font-medium mb-2">Industries</div>
        <div className="flex flex-wrap gap-2">
          {industryOptions.length ? industryOptions.map(i => (
            <button
              key={i}
              onClick={() => toggleIndustry(i)}
              className={`text-sm px-2 py-1 rounded border ${ (filters.industries || []).includes(i) ? 'bg-slate-700 text-white' : 'bg-white text-gray-700' }`}
            >{i}</button>
          )) : <div className="text-xs text-gray-500">No industries</div>}
        </div>
      </div>
    </div>
  );
}
