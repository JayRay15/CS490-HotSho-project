/**
 * Portfolio Modal - Document-style view of user's projects
 * Displays projects in a clean, professional format similar to resume templates
 */

import React, { useState, useMemo } from 'react';

// Helper to apply filters
function applyFilters(projects = [], filters = {}) {
    const { techs = [], sort = 'dateDesc' } = filters;

    let out = projects.slice();

    // Filter by technologies
    if (techs.length) {
        out = out.filter(p => {
            const t = Array.isArray(p.technologies)
                ? p.technologies
                : (p.technologies || '').split?.(',') || [];
            return techs.every(sel =>
                t.map(x => x.trim().toLowerCase()).includes(sel.toLowerCase())
            );
        });
    }

    // Sort by date
    if (sort === 'dateDesc') {
        out.sort((a, b) => new Date(b.startDate || b.createdAt || 0) - new Date(a.startDate || a.createdAt || 0));
    } else if (sort === 'dateAsc') {
        out.sort((a, b) => new Date(a.startDate || a.createdAt || 0) - new Date(b.startDate || b.createdAt || 0));
    }

    return out;
}

export default function PortfolioModal({ projects = [], onClose, userName = '' }) {
    const [filters, setFilters] = useState({ techs: [], sort: 'dateDesc' });

    // Extract unique technologies for filter dropdown
    const techOptions = useMemo(() => {
        const allTechs = projects.flatMap(p =>
            Array.isArray(p.technologies)
                ? p.technologies
                : (p.technologies || '').split(',').map(t => t.trim()).filter(Boolean)
        );
        return Array.from(new Set(allTechs)).sort();
    }, [projects]);

    const filteredProjects = useMemo(() => applyFilters(projects, filters), [projects, filters]);

    const handleTechChange = (e) => {
        const selected = Array.from(e.target.selectedOptions, opt => opt.value);
        setFilters(prev => ({ ...prev, techs: selected }));
    };

    const handleSortChange = (e) => {
        setFilters(prev => ({ ...prev, sort: e.target.value }));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                    <h3 className="text-2xl font-heading font-semibold">Project Portfolio</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="bg-white border-b px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <select
                                value={filters.sort}
                                onChange={handleSortChange}
                                className="border rounded p-2"
                            >
                                <option value="dateDesc">Newest</option>
                                <option value="dateAsc">Oldest</option>
                            </select>
                        </div>
                    </div>

                    {techOptions.length > 0 && (
                        <div className="mt-3">
                            <div className="text-sm font-medium mb-2">Technologies</div>
                            <div className="flex flex-wrap gap-2">
                                {techOptions.map(tech => (
                                    <button
                                        key={tech}
                                        onClick={() => {
                                            const set = new Set(filters.techs || []);
                                            if (set.has(tech)) set.delete(tech); else set.add(tech);
                                            setFilters(prev => ({ ...prev, techs: Array.from(set) }));
                                        }}
                                        className={`text-sm px-2 py-1 rounded border ${(filters.techs || []).includes(tech) ? 'bg-slate-700 text-white' : 'bg-white text-gray-700'}`}
                                    >
                                        {tech}
                                    </button>
                                ))}
                                {filters.techs.length > 0 && (
                                    <button
                                        onClick={() => setFilters(prev => ({ ...prev, techs: [] }))}
                                        className="text-sm px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Document View */}
                <div className="p-8 bg-gray-100">
                    {/* Simulated document page */}
                    <div
                        className="bg-white shadow-lg mx-auto"
                        style={{ maxWidth: '8.5in', minHeight: '11in', padding: '0.75in' }}
                    >
                        {/* Header */}
                        <div className="text-center mb-8 pb-6 border-b-2" style={{ borderColor: '#4F5348' }}>
                            <h1 className="text-3xl font-bold mb-2" style={{ color: '#2C2C2C', fontFamily: 'Georgia, serif' }}>
                                {userName ? `${userName}'s ` : ''}Project Portfolio
                            </h1>
                            <p className="text-sm" style={{ color: '#666', fontFamily: 'Times New Roman, serif' }}>
                                {filteredProjects.length} Project{filteredProjects.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Projects List */}
                        {filteredProjects.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No projects match the current filters.</p>
                        ) : (
                            <div className="space-y-8">
                                {filteredProjects.map((project, index) => {
                                    const techs = Array.isArray(project.technologies)
                                        ? project.technologies
                                        : (project.technologies || '').split(',').map(t => t.trim()).filter(Boolean);

                                    return (
                                        <div key={project._id || project.id || index} className="mb-6">
                                            {/* Project Title and Date */}
                                            <div className="flex justify-between items-baseline mb-2">
                                                <h2
                                                    className="text-xl font-bold"
                                                    style={{ color: '#4F5348', fontFamily: 'Georgia, serif' }}
                                                >
                                                    {project.name}
                                                </h2>
                                                <span className="text-sm font-semibold" style={{ color: '#666' }}>
                                                    {formatDate(project.startDate)}
                                                    {project.endDate && ` - ${formatDate(project.endDate)}`}
                                                    {!project.endDate && project.status === 'Ongoing' && ' - Present'}
                                                </span>
                                            </div>

                                            {/* Role */}
                                            {project.role && (
                                                <p className="text-sm italic mb-2" style={{ color: '#555', fontFamily: 'Georgia, serif' }}>
                                                    {project.role}
                                                </p>
                                            )}

                                            {/* Description */}
                                            {project.description && (
                                                <p className="mb-3" style={{ lineHeight: '1.6', fontFamily: 'Times New Roman, serif', color: '#2C2C2C' }}>
                                                    {project.description}
                                                </p>
                                            )}

                                            {/* Technologies */}
                                            {techs.length > 0 && (
                                                <p className="text-sm mb-2" style={{ color: '#666', fontFamily: 'Times New Roman, serif' }}>
                                                    <strong>Technologies:</strong> {techs.join(' • ')}
                                                </p>
                                            )}

                                            {/* Outcomes */}
                                            {project.outcomes && (
                                                <div className="mt-2">
                                                    <p className="text-sm font-semibold" style={{ color: '#4F5348' }}>Key Outcomes:</p>
                                                    <p className="text-sm" style={{ lineHeight: '1.6', fontFamily: 'Times New Roman, serif', color: '#2C2C2C' }}>
                                                        {project.outcomes}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Project URL */}
                                            {(project.projectUrl || project.url) && (
                                                <p className="text-sm mt-2">
                                                    <a
                                                        href={project.projectUrl || project.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline"
                                                        style={{ fontFamily: 'Times New Roman, serif' }}
                                                    >
                                                        View Project →
                                                    </a>
                                                </p>
                                            )}

                                            {/* Divider between projects */}
                                            {index < filteredProjects.length - 1 && (
                                                <hr className="mt-6 border-gray-200" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
