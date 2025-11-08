import React from 'react';
import { useDrag, useDrop } from 'react-dnd';

/**
 * DnD Section Toggle Item Component
 * Used in customization panel for reordering and toggling sections
 */
const SectionToggleItem = ({ 
  section, 
  index, 
  visibleSections,
  sectionFormatting,
  viewingResume,
  moveSection,
  handleToggleSection,
  openSectionFormatting,
  getSectionStatus
}) => {
  const ref = React.useRef(null);
  
  const [, drop] = useDrop({
    accept: 'section',
    hover(item) {
      if (item.index === index) return;
      moveSection(item.index, index);
      item.index = index;
    },
  });
  
  const [{ isDragging }, drag] = useDrag({
    type: 'section',
    item: { type: 'section', key: section.key, index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  
  drag(drop(ref));

  const hasFormatting = !!sectionFormatting[section.key];
  const sectionStatus = getSectionStatus(section.key);

  // Completion indicator
  const isComplete = viewingResume.sections?.[section.key] && (
    Array.isArray(viewingResume.sections[section.key])
      ? viewingResume.sections[section.key].length > 0
      : !!viewingResume.sections[section.key]
  );

  const getBorderColor = () => {
    if (sectionStatus === 'required') return 'border-red-300';
    if (sectionStatus === 'recommended') return 'border-yellow-300';
    return 'border-gray-300';
  };

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={`flex items-center gap-2 text-sm cursor-move border-2 ${getBorderColor()} px-3 py-2 rounded-lg bg-white hover:shadow-md transition-shadow relative`}
    >
      <input
        type="checkbox"
        checked={visibleSections.includes(section.key)}
        onChange={() => handleToggleSection(section.key)}
        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
      />
      <span className="font-medium text-gray-700">{section.label}</span>
      <span
        className={`text-sm ${isComplete ? 'text-green-600' : 'text-gray-400'}`}
        title={isComplete ? 'Section complete' : 'Section incomplete'}
      >
        {isComplete ? '✓' : '○'}
      </span>
      {sectionStatus === 'required' && (
        <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-semibold">REQ</span>
      )}
      {sectionStatus === 'recommended' && (
        <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded font-semibold">REC</span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); openSectionFormatting(section.key); }}
        className={`p-1 rounded hover:bg-gray-100 transition ${hasFormatting ? 'text-blue-600' : 'text-gray-400'}`}
        title="Format section"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </button>
      <span className="text-gray-400 text-sm ml-auto" style={{ cursor: 'grab' }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </span>
    </div>
  );
};

export default SectionToggleItem;
