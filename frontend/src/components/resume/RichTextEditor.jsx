/**
 * RichTextEditor Component (UC-053)
 * Simple rich text editor for resume content (React 19 compatible)
 */

import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = 'Start typing...', 
  className = '',
  readOnly = false,
  simple = false
}) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = (e) => {
    const newValue = e.target.innerHTML;
    if (onChange && newValue !== value) {
      onChange(newValue);
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const ToolbarButton = ({ command, icon, title, value }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        execCommand(command, value);
      }}
      className="p-2 hover:bg-gray-200 rounded transition text-gray-700"
      title={title}
    >
      {icon}
    </button>
  );

  return (
    <div className={`rich-text-editor border border-gray-300 rounded-lg ${className}`}>
      {!readOnly && (
        <div className="toolbar flex flex-wrap gap-1 p-2 border-b border-gray-300 bg-gray-50">
          <ToolbarButton 
            command="bold" 
            title="Bold (Ctrl+B)"
            icon={<span className="font-bold">B</span>}
          />
          <ToolbarButton 
            command="italic" 
            title="Italic (Ctrl+I)"
            icon={<span className="italic">I</span>}
          />
          <ToolbarButton 
            command="underline" 
            title="Underline (Ctrl+U)"
            icon={<span className="underline">U</span>}
          />
          
          <div className="w-px bg-gray-300 mx-1"></div>
          
          <ToolbarButton 
            command="insertUnorderedList" 
            title="Bullet List"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            }
          />
          <ToolbarButton 
            command="insertOrderedList" 
            title="Numbered List"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M3 10h18M3 16h18" />
              </svg>
            }
          />
          
          {!simple && (
            <>
              <div className="w-px bg-gray-300 mx-1"></div>
              
              <ToolbarButton 
                command="formatBlock" 
                value="h3"
                title="Heading"
                icon={<span className="font-bold">H</span>}
              />
              <ToolbarButton 
                command="removeFormat" 
                title="Clear Formatting"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                }
              />
            </>
          )}
        </div>
      )}
      
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleInput}
        className={`editor-content p-3 min-h-[120px] max-h-[400px] overflow-y-auto focus:outline-none ${
          simple ? 'min-h-[80px]' : ''
        } ${readOnly ? 'bg-gray-50' : ''}`}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
      
      <style jsx>{`
        .editor-content:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        .editor-content:focus {
          outline: none;
        }
        
        .rich-text-editor:focus-within {
          border-color: #4F5348;
          box-shadow: 0 0 0 1px #4F5348;
        }
        
        .editor-content ul,
        .editor-content ol {
          margin-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .editor-content ul {
          list-style-type: disc;
        }
        
        .editor-content ol {
          list-style-type: decimal;
        }
        
        .editor-content li {
          margin-bottom: 0.25rem;
        }
        
        .editor-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .editor-content p {
          margin-bottom: 0.5rem;
        }
        
        .editor-content strong {
          font-weight: 600;
        }
        
        .editor-content em {
          font-style: italic;
        }
        
        .editor-content u {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

RichTextEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  readOnly: PropTypes.bool,
  simple: PropTypes.bool,
};

export default RichTextEditor;
