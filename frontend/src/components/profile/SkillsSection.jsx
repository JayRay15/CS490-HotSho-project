import React, { useState } from 'react';
import Card from '../Card';
import SortableSkillItem from './SortableSkillItem';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from "@clerk/clerk-react";
import api, { setAuthToken } from "../../api/axios";

export default function SkillsSection({
    skillList,
    setSkillList,
    onAdd,
    onEdit,
    onDelete,
    successMessage
}) {
    const { getToken } = useAuth();
    const [skillSearchQuery, setSkillSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState({
        'Technical': true,
        'Soft Skills': true,
        'Languages': true,
        'Industry-Specific': true
    });
    const [error, setError] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const groupSkillsByCategory = (skills) => {
        const grouped = {};
        skills.forEach(skill => {
            const cat = skill.category || 'Other';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(skill);
        });
        return grouped;
    };

    const getSkillLevelSummary = (skills) => {
        const summary = { Beginner: 0, Intermediate: 0, Advanced: 0, Expert: 0 };
        skills.forEach(skill => {
            if (summary.hasOwnProperty(skill.level)) {
                summary[skill.level]++;
            }
        });
        return summary;
    };

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const filteredSkills = skillList.filter(skill => {
        if (!skillSearchQuery.trim()) return true;
        const query = skillSearchQuery.toLowerCase();
        return (
            skill.name.toLowerCase().includes(query) ||
            skill.category.toLowerCase().includes(query) ||
            skill.level.toLowerCase().includes(query)
        );
    });

    const handleSkillDragEnd = async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = skillList.findIndex(s => s._id === active.id);
        const newIndex = skillList.findIndex(s => s._id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const newSkillList = arrayMove(skillList, oldIndex, newIndex);
        setSkillList(newSkillList);

        try {
            const token = await getToken();
            setAuthToken(token);
            await api.put('/api/profile/skills/reorder', { skills: newSkillList.map(s => s._id) });
        } catch (err) {
            console.error('Failed to persist skill order:', err);
        }
    };

    const moveSkillToCategory = async (skill, newCategory) => {
        try {
            const token = await getToken();
            setAuthToken(token);
            await api.put(`/api/profile/skills/${skill._id}`, { ...skill, category: newCategory });

            setSkillList(prev => prev.map(s =>
                s._id === skill._id ? { ...s, category: newCategory } : s
            ));
        } catch (err) {
            console.error('Failed to move skill:', err);
            setError(err);
        }
    };

    const exportSkillsByCategory = () => {
        const grouped = groupSkillsByCategory(skillList);
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];

        const doc = new jsPDF({ unit: 'pt', format: 'a4' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('Skills Export', 40, 40);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Date: ${dateStr}`, 40, 60);
        doc.text(`Total skills: ${skillList.length}`, 40, 75);

        let currentY = 95;

        const categories = Object.keys(grouped);
        if (categories.length === 0) {
            doc.text('No skills to export.', 40, currentY);
        }

        categories.forEach((category, idx) => {
            if (idx > 0) {
                currentY += 20;
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text(`${category} (${grouped[category].length})`, 40, currentY);

            const summary = getSkillLevelSummary(grouped[category]);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            currentY += 14;
            doc.text(
                `Beginner: ${summary.Beginner}   Intermediate: ${summary.Intermediate}   Advanced: ${summary.Advanced}   Expert: ${summary.Expert}`,
                40,
                currentY
            );

            const rows = grouped[category]
                .map(s => [s.name || '', s.level || '', s.category || category]);

            autoTable(doc, {
                startY: currentY + 8,
                margin: { left: 40, right: 40 },
                head: [['Name', 'Level', 'Category']],
                body: rows,
                styles: { font: 'helvetica', fontSize: 10 },
                headStyles: { fillColor: [33, 150, 243], textColor: 255 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
            });

            currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY : currentY + 40;
        });

        doc.save(`skills-export-${dateStr}.pdf`);
    };

    return (
        <Card variant="default" title="Skills">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <p className="text-sm mt-1" style={{ color: '#656A5C' }}>{skillList.length} total skills across {Object.keys(groupSkillsByCategory(skillList)).length} categories</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportSkillsByCategory}
                        disabled={skillList.length === 0}
                        className="px-4 py-2 border rounded-lg transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ borderColor: '#D1D5DB', color: '#656A5C' }}
                        onMouseOver={(e) => skillList.length > 0 && (e.currentTarget.style.backgroundColor = '#F5F6F4')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        title="Export skills by category"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Export</span>
                    </button>
                    <button
                        onClick={onAdd}
                        className="px-4 py-2 text-white rounded-lg transition flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{ backgroundColor: '#777C6D' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Skill</span>
                    </button>
                </div>
            </div>

            {successMessage && (
                <div className="mb-4 p-4 border rounded-lg" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                    <p className="font-medium" style={{ color: '#166534' }}>{successMessage}</p>
                </div>
            )}

            {skillList.length > 0 && (
                <div className="mb-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={skillSearchQuery}
                            onChange={(e) => setSkillSearchQuery(e.target.value)}
                            placeholder="Search skills by name, category, or proficiency..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {skillSearchQuery && (
                            <button
                                onClick={() => setSkillSearchQuery('')}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {skillList.length > 0 ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSkillDragEnd}>
                    {Object.entries(groupSkillsByCategory(filteredSkills)).map(([category, skills]) => (
                        <div key={category} className="mb-6 last:mb-0">
                            <div
                                className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg mb-3 cursor-pointer hover:from-gray-100 hover:to-gray-150 transition"
                                onClick={() => toggleCategory(category)}
                            >
                                <div className="flex items-center space-x-3">
                                    <button className="text-gray-600">
                                        <svg className={`w-5 h-5 transition-transform ${expandedCategories[category] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">{category}</h3>
                                        <div className="flex items-center space-x-4 mt-1">
                                            <span className="text-sm text-gray-600">{skills.length} skill{skills.length !== 1 ? 's' : ''}</span>
                                            <div className="flex items-center space-x-2 text-xs">
                                                {Object.entries(getSkillLevelSummary(skills)).map(([level, count]) => (
                                                    count > 0 && (
                                                        <span key={level} className={`px-2 py-0.5 rounded ${level === 'Beginner' ? 'bg-gray-200 text-gray-800' :
                                                            level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                                                level === 'Advanced' ? 'bg-indigo-100 text-indigo-800' :
                                                                    'bg-green-100 text-green-800'
                                                            }`}>
                                                            {count} {level}
                                                        </span>
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {expandedCategories[category] && (
                                <SortableContext items={skills.map(s => s._id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2 pl-8">
                                        {skills.map((skill) => (
                                            <SortableSkillItem
                                                key={skill._id}
                                                skill={skill}
                                                onEdit={onEdit}
                                                onDelete={onDelete}
                                                onMoveCategory={moveSkillToCategory}
                                                categories={['Technical', 'Soft Skills', 'Languages', 'Industry-Specific']}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            )}
                        </div>
                    ))}
                </DndContext>
            ) : (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#D1D5DB' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p className="italic" style={{ color: '#9CA3AF' }}>No skills added yet. Click "Add Skill" to get started!</p>
                </div>
            )}
        </Card>
    );
}
