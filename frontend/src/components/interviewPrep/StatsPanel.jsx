import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const CAT_COLORS = { Behavioral: '#f59e0b', Technical: '#3b82f6', Situational: '#8b5cf6' };
const DIFF_COLORS = { Easy: '#10b981', Medium: '#eab308', Hard: '#ef4444' };

export function StatsPanel({ stats }) {
  if (!stats) return null;
  const practicedPct = stats.total === 0 ? 0 : Math.round((stats.practicedCount / stats.total) * 100);
  const catData = Object.entries(stats.byCategory).map(([name, value]) => ({ name, value }));
  const diffData = Object.entries(stats.byDifficulty).map(([difficulty, count]) => ({ difficulty, count }));
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="p-4 border rounded bg-white shadow-sm flex flex-col justify-between">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Overall Progress</h3>
        <div className="flex items-center justify-center h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={[{ name: 'Practiced', value: stats.practicedCount }, { name: 'Remaining', value: stats.total - stats.practicedCount }]} dataKey="value" innerRadius={45} outerRadius={60}>
                <Cell fill="#10b981" />
                <Cell fill="#e5e7eb" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-xs text-gray-600">{practicedPct}% practiced of {stats.total} questions</p>
      </div>
      <div className="p-4 border rounded bg-white shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">By Category</h3>
        <div className="space-y-2 text-xs">
          {catData.map(d => (
            <div key={d.name} className="flex items-center justify-between">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: CAT_COLORS[d.name] }} />{d.name}</span>
              <span>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 border rounded bg-white shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">By Difficulty</h3>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={diffData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <XAxis dataKey="difficulty" fontSize={10} />
            <YAxis fontSize={10} allowDecimals={false} />
            <Tooltip cursor={{ fill: '#f3f4f6' }} />
            <Bar dataKey="count">
              {diffData.map(entry => (
                <Cell key={entry.difficulty} fill={DIFF_COLORS[entry.difficulty]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
