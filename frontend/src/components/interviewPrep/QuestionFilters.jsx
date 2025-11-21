import React from 'react';

export function QuestionFilters({ filters, setFilters }) {
  const toggleCategory = (cat) => {
    setFilters(prev => {
      const categories = new Set(prev.categories);
      if (categories.has(cat)) categories.delete(cat); else categories.add(cat);
      return { ...prev, categories };
    });
  };
  const toggleDifficulty = (diff) => {
    setFilters(prev => {
      const difficulties = new Set(prev.difficulties);
      if (difficulties.has(diff)) difficulties.delete(diff); else difficulties.add(diff);
      return { ...prev, difficulties };
    });
  };
  return (
    <div className="flex flex-wrap gap-3 items-center mb-4">
      <div className="flex gap-2">
        {['Behavioral','Technical','Situational'].map(c => (
          <button key={c} onClick={() => toggleCategory(c)}
            className={`px-3 py-1 rounded-full text-sm border transition ${filters.categories.has(c) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}> {c} </button>
        ))}
      </div>
      <div className="flex gap-2">
        {['Easy','Medium','Hard'].map(d => (
          <button key={d} onClick={() => toggleDifficulty(d)}
            className={`px-3 py-1 rounded-full text-sm border transition ${filters.difficulties.has(d) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}>{d}</button>
        ))}
      </div>
      <select value={filters.practice} onChange={e => setFilters(prev => ({ ...prev, practice: e.target.value }))} className="border rounded px-2 py-1 text-sm">
        <option value="All">All</option>
        <option value="Practiced">Practiced</option>
        <option value="Unpracticed">Unpracticed</option>
      </select>
      <input
        placeholder="Search text or skill"
        value={filters.search}
        onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
        className="border rounded px-3 py-1 text-sm flex-1 min-w-[180px]"
      />
      <button onClick={() => setFilters({ categories: new Set(['Behavioral','Technical','Situational']), difficulties: new Set(), practice: 'All', search: '' })} className="text-xs text-gray-500 hover:text-gray-700 underline">Reset</button>
    </div>
  );
}
