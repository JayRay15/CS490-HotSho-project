import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function SortableSkillItem({ skill, onEdit, onDelete, onMoveCategory, categories }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: skill._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const [showCategoryMenu, setShowCategoryMenu] = useState(false);

    const getLevelColor = (level) => {
        switch (level) {
            case 'Beginner': return 'bg-gray-200 text-gray-800';
            case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'Advanced': return 'bg-indigo-100 text-indigo-800';
            case 'Expert': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition"
        >
            <div className="flex items-center space-x-3 flex-1">
                {/* Drag Handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
                    title="Drag to reorder"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                </button>

                {/* Skill Name */}
                <span className="text-sm font-medium text-gray-800 flex-1">{skill.name}</span>

                {/* Proficiency Badge */}
                <span className={`text-xs px-2 py-1 rounded font-medium ${getLevelColor(skill.level)}`}>
                    {skill.level}
                </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1 ml-3 opacity-0 group-hover:opacity-100 transition">
                {/* Move to Category Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                        className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition"
                        title="Move to category"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12m-12 5h12M3 7h.01M3 12h.01M3 17h.01" />
                        </svg>
                    </button>
                    {showCategoryMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowCategoryMenu(false)} />
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                {categories.filter(cat => cat !== skill.category).map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => {
                                            onMoveCategory(skill, cat);
                                            setShowCategoryMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                                    >
                                        Move to {cat}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Edit Button */}
                <button
                    onClick={() => onEdit(skill)}
                    className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                    title="Edit skill"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>

                {/* Delete Button */}
                <button
                    onClick={() => onDelete(skill)}
                    className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition"
                    title="Delete skill"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
