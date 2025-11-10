import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import axios from '../api/axios';

/**
 * UC-060: Rich text editor for cover letter editing with AI-powered assistance
 * Features:
 * - Rich text formatting (bold, italic, lists)
 * - Real-time word/character count
 * - Spell check and grammar assistance
 * - Synonym suggestions
 * - Readability score
 * - Sentence restructuring
 * - Version history
 * - Auto-save functionality
 */
const CoverLetterEditor = ({ 
  initialContent, 
  onChange, 
  coverLetterId,
  onSave 
}) => {
  // Editor state
  const [content, setContent] = useState(initialContent || '');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  
  // AI assistance state
  const [spellingIssues, setSpellingIssues] = useState([]);
  const [readabilityScore, setReadabilityScore] = useState(null);
  const [synonymSuggestions, setSynonymSuggestions] = useState(null);
  const [restructuringSuggestions, setRestructuringSuggestions] = useState(null);
  
  // UI state
  const [showSpellCheck, setShowSpellCheck] = useState(false);
  const [showReadability, setShowReadability] = useState(false);
  const [showSynonyms, setShowSynonyms] = useState(false);
  const [showRestructure, setShowRestructure] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editHistory, setEditHistory] = useState([]);
  
  // Loading states
  const [isCheckingSpelling, setIsCheckingSpelling] = useState(false);
  const [isAnalyzingReadability, setIsAnalyzingReadability] = useState(false);
  const [isFetchingSynonyms, setIsFetchingSynonyms] = useState(false);
  const [isFetchingRestructure, setIsFetchingRestructure] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Auto-save
  const autoSaveTimerRef = useRef(null);
  const [lastSaved, setLastSaved] = useState(null);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start editing your cover letter...',
      }),
    ],
    content: initialContent,
    onCreate: ({ editor }) => {
      // Initialize word and character count when editor is created
      const text = editor.getText();
      setCharCount(text.length);
      setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      
      setContent(html);
      setCharCount(text.length);
      setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
      
      if (onChange) {
        onChange(html);
      }
      
      // Trigger auto-save
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave(html);
      }, 3000); // Auto-save after 3 seconds of inactivity
    },
  });

  // Get selected text
  useEffect(() => {
    if (editor) {
      editor.on('selectionUpdate', () => {
        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to, ' ');
        setSelectedText(text);
      });
    }
  }, [editor]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Auto-save function
  const handleAutoSave = async (contentToSave) => {
    if (!coverLetterId || !contentToSave.trim()) return;
    
    try {
      await axios.post(`/api/cover-letters/${coverLetterId}/versions`, {
        content: contentToSave,
        note: 'Auto-save'
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // Manual save
  const handleManualSave = async () => {
    if (!coverLetterId || !content.trim()) return;
    
    setIsSaving(true);
    try {
      await axios.post(`/api/cover-letters/${coverLetterId}/versions`, {
        content,
        note: 'Manual save'
      });
      setLastSaved(new Date());
      if (onSave) {
        onSave(content);
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Spell and grammar check
  const checkSpelling = async () => {
    const text = editor.getText();
    if (!text.trim()) return;
    
    setIsCheckingSpelling(true);
    try {
      const response = await axios.post('/api/cover-letters/editing/spell-check', { text });
      setSpellingIssues(response.data.data.analysis.issues || []);
      setShowSpellCheck(true);
    } catch (error) {
      console.error('Spell check failed:', error);
      alert('Failed to check spelling. Please try again.');
    } finally {
      setIsCheckingSpelling(false);
    }
  };

  // Readability analysis
  const analyzeReadability = async () => {
    const text = editor.getText();
    if (!text.trim()) return;
    
    setIsAnalyzingReadability(true);
    try {
      const response = await axios.post('/api/cover-letters/editing/readability', { text });
      setReadabilityScore(response.data.data.analysis);
      setShowReadability(true);
    } catch (error) {
      console.error('Readability analysis failed:', error);
      alert('Failed to analyze readability. Please try again.');
    } finally {
      setIsAnalyzingReadability(false);
    }
  };

  // Get synonyms for selected text
  const getSynonyms = async () => {
    if (!selectedText.trim()) {
      alert('Please select a word or phrase to get synonym suggestions.');
      return;
    }
    
    setIsFetchingSynonyms(true);
    try {
      const response = await axios.post('/api/cover-letters/editing/synonyms', { 
        word: selectedText,
        context: editor.getText()
      });
      setSynonymSuggestions(response.data.data.suggestions);
      setShowSynonyms(true);
    } catch (error) {
      console.error('Synonym fetch failed:', error);
      alert('Failed to get synonyms. Please try again.');
    } finally {
      setIsFetchingSynonyms(false);
    }
  };

  // Get restructuring suggestions
  const getRestructuringSuggestions = async () => {
    if (!selectedText.trim()) {
      alert('Please select a sentence or paragraph to get restructuring suggestions.');
      return;
    }
    
    setIsFetchingRestructure(true);
    try {
      const response = await axios.post('/api/cover-letters/editing/restructure', { 
        text: selectedText,
        type: selectedText.split('.').length > 1 ? 'paragraph' : 'sentence'
      });
      setRestructuringSuggestions(response.data.data.suggestions);
      setShowRestructure(true);
    } catch (error) {
      console.error('Restructuring fetch failed:', error);
      alert('Failed to get restructuring suggestions. Please try again.');
    } finally {
      setIsFetchingRestructure(false);
    }
  };

  // Load edit history
  const loadHistory = async () => {
    if (!coverLetterId) return;
    
    try {
      const response = await axios.get(`/api/cover-letters/${coverLetterId}/history`);
      setEditHistory(response.data.data.history || []);
      setShowHistory(true);
    } catch (error) {
      console.error('Failed to load history:', error);
      alert('Failed to load edit history. Please try again.');
    }
  };

  // Apply spelling correction
  const applyCorrection = (issue) => {
    if (!editor || !issue.suggestion) return;
    
    // Get the current HTML content to preserve formatting
    const currentHtml = editor.getHTML();
    
    // Replace the text in HTML, being careful to preserve tags
    // Use a regex to find the text outside of HTML tags
    const escapedText = issue.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(>[^<]*)(${escapedText})([^>]*<)`, 'gi');
    
    let newHtml = currentHtml;
    let replaced = false;
    
    // Try to replace within text nodes (between tags)
    newHtml = currentHtml.replace(regex, (match, before, text, after) => {
      replaced = true;
      return before + issue.suggestion + after;
    });
    
    // If no match found in tags, try replacing in plain text nodes
    if (!replaced) {
      const textRegex = new RegExp(`\\b${escapedText}\\b`, 'gi');
      newHtml = currentHtml.replace(textRegex, issue.suggestion);
    }
    
    editor.commands.setContent(newHtml);
    
    // Remove the fixed issue from the list
    setSpellingIssues(prevIssues => 
      prevIssues.filter(i => i.text !== issue.text || i.suggestion !== issue.suggestion)
    );
  };

  // Replace selected text with synonym
  const replaceSynonym = (synonym) => {
    if (!editor || !selectedText) return;
    
    // Preserve the capitalization of the original word
    let replacementWord = synonym.word;
    
    // Check if the first character of selected text is uppercase
    if (selectedText.length > 0 && selectedText[0] === selectedText[0].toUpperCase()) {
      // Capitalize the synonym
      replacementWord = synonym.word.charAt(0).toUpperCase() + synonym.word.slice(1);
    } else if (selectedText.length > 0 && selectedText[0] === selectedText[0].toLowerCase()) {
      // Lowercase the synonym
      replacementWord = synonym.word.charAt(0).toLowerCase() + synonym.word.slice(1);
    }
    
    editor.chain().focus().deleteSelection().insertContent(replacementWord).run();
    setShowSynonyms(false);
    setSynonymSuggestions(null);
  };

  // Apply restructuring suggestion
  const applyRestructuring = (variation) => {
    if (!editor || !selectedText) return;
    
    editor.chain().focus().deleteSelection().insertContent(variation.text).run();
    setShowRestructure(false);
    setRestructuringSuggestions(null);
  };

  // Restore version from history
  const restoreVersion = (version) => {
    if (!editor) return;
    
    const confirmed = window.confirm('Are you sure you want to restore this version? Your current changes will be saved as a new version.');
    if (confirmed) {
      editor.commands.setContent(version.content);
      setShowHistory(false);
    }
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="cover-letter-editor">
      {/* Toolbar */}
      <div className="border-b border-gray-300 p-3 bg-gray-50 rounded-t-lg flex flex-wrap items-center gap-2">
        {/* Formatting buttons */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded ${editor.isActive('bold') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded ${editor.isActive('italic') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1 rounded ${editor.isActive('bulletList') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
            title="Bullet List"
          >
            • List
          </button>
        </div>

        {/* AI Assistance buttons */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <button
            onClick={checkSpelling}
            disabled={isCheckingSpelling}
            className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-sm disabled:opacity-50"
            title="Check Spelling & Grammar"
          >
            {isCheckingSpelling ? '...' : '✓ Spell Check'}
          </button>
          <button
            onClick={analyzeReadability}
            disabled={isAnalyzingReadability}
            className="px-3 py-1 rounded bg-green-100 hover:bg-green-200 text-sm disabled:opacity-50"
            title="Analyze Readability"
          >
            {isAnalyzingReadability ? '...' : '📊 Readability'}
          </button>
        </div>

        {/* Selection-based tools */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <button
            onClick={getSynonyms}
            disabled={!selectedText || isFetchingSynonyms}
            className="px-3 py-1 rounded bg-purple-100 hover:bg-purple-200 text-sm disabled:opacity-50"
            title="Get Synonyms for Selected Text"
          >
            {isFetchingSynonyms ? '...' : '📖 Synonyms'}
          </button>
          <button
            onClick={getRestructuringSuggestions}
            disabled={!selectedText || isFetchingRestructure}
            className="px-3 py-1 rounded bg-yellow-100 hover:bg-yellow-200 text-sm disabled:opacity-50"
            title="Restructure Selected Text"
          >
            {isFetchingRestructure ? '...' : '🔄 Restructure'}
          </button>
        </div>

        {/* History and save */}
        <div className="flex items-center gap-1">
          <button
            onClick={loadHistory}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
            title="View Edit History"
          >
            🕒 History
          </button>
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className="px-3 py-1 rounded text-white text-sm disabled:opacity-50"
            style={{ backgroundColor: '#777C6D' }}
            title="Save Version"
          >
            {isSaving ? 'Saving...' : '💾 Save'}
          </button>
        </div>

        {/* Auto-save indicator */}
        {lastSaved && (
          <span className="text-xs text-gray-500 ml-auto">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Editor area with side panels */}
      <div className="flex">
        {/* Main editor */}
        <div className="flex-1">
          <EditorContent 
            editor={editor} 
            className="prose max-w-none p-4 min-h-[400px] focus:outline-none"
          />
          
          {/* Word/Character count */}
          <div className="border-t border-gray-300 p-2 bg-gray-50 text-sm text-gray-600 flex justify-between">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
          </div>
        </div>

        {/* Side panels for AI assistance */}
        {(showSpellCheck || showReadability || showSynonyms || showRestructure || showHistory) && (
          <div className="w-80 border-l border-gray-300 p-4 bg-gray-50 overflow-y-auto" style={{ maxHeight: '500px' }}>
            {/* Spell Check Panel */}
            {showSpellCheck && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg">Spelling & Grammar</h3>
                  <button 
                    onClick={() => setShowSpellCheck(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                {spellingIssues.length === 0 ? (
                  <p className="text-green-600">✓ No issues found!</p>
                ) : (
                  <div className="space-y-2">
                    {spellingIssues.map((issue, index) => (
                      <div key={index} className="p-2 bg-white rounded border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className={`inline-block px-2 py-1 rounded text-xs mb-1 ${
                              issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              issue.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {issue.type}
                            </span>
                            <p className="text-sm line-through">{issue.text}</p>
                            <p className="text-sm text-green-600">→ {issue.suggestion}</p>
                            <p className="text-xs text-gray-500 mt-1">{issue.explanation}</p>
                          </div>
                          <button
                            onClick={() => applyCorrection(issue)}
                            className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                          >
                            Fix
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Readability Panel */}
            {showReadability && readabilityScore && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg">Readability Score</h3>
                  <button 
                    onClick={() => setShowReadability(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-3 bg-white rounded border border-gray-200">
                  <div className="text-center mb-3">
                    <div className={`text-4xl font-bold ${
                      readabilityScore.readabilityScore >= 80 ? 'text-green-600' :
                      readabilityScore.readabilityScore >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {readabilityScore.readabilityScore}/100
                    </div>
                    <p className="text-sm text-gray-600">Overall Score</p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Avg. Sentence Length:</span>
                      <span className="font-medium">{readabilityScore.metrics.averageSentenceLength} words</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vocabulary:</span>
                      <span className="font-medium capitalize">{readabilityScore.metrics.vocabularyLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tone:</span>
                      <span className="font-medium capitalize">{readabilityScore.metrics.toneConsistency}</span>
                    </div>
                  </div>

                  {readabilityScore.strengths && readabilityScore.strengths.length > 0 && (
                    <div className="mt-3">
                      <p className="font-semibold text-green-700 mb-1">Strengths:</p>
                      <ul className="text-sm space-y-1">
                        {readabilityScore.strengths.map((strength, i) => (
                          <li key={i} className="text-green-600">✓ {strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {readabilityScore.improvements && readabilityScore.improvements.length > 0 && (
                    <div className="mt-3">
                      <p className="font-semibold text-orange-700 mb-1">Suggestions:</p>
                      <ul className="text-sm space-y-2">
                        {readabilityScore.improvements.map((imp, i) => (
                          <li key={i} className="text-orange-600">
                            • {imp.issue}
                            <p className="text-xs text-gray-600 mt-1">{imp.suggestion}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {readabilityScore.summary && (
                    <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
                      {readabilityScore.summary}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Synonyms Panel */}
            {showSynonyms && synonymSuggestions && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg">Synonym Suggestions</h3>
                  <button 
                    onClick={() => setShowSynonyms(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-2">For: <strong>{synonymSuggestions.word}</strong></p>
                <div className="space-y-2">
                  {synonymSuggestions.synonyms.map((syn, index) => (
                    <div key={index} className="p-2 bg-white rounded border border-gray-200 hover:border-purple-300 cursor-pointer"
                         onClick={() => replaceSynonym(syn)}>
                      <p className="font-medium text-purple-700">{syn.word}</p>
                      <p className="text-xs text-gray-600">{syn.usage}</p>
                      <p className="text-xs text-gray-500 italic mt-1">{syn.example}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Restructuring Panel */}
            {showRestructure && restructuringSuggestions && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg">Restructuring Options</h3>
                  <button 
                    onClick={() => setShowRestructure(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2">
                  {restructuringSuggestions.variations.map((variation, index) => (
                    <div key={index} className="p-2 bg-white rounded border border-gray-200">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold text-yellow-700 uppercase">{variation.emphasis}</span>
                        <span className="text-xs text-gray-500">{variation.wordCountChange}</span>
                      </div>
                      <p className="text-sm mb-2">{variation.text}</p>
                      <p className="text-xs text-gray-600 mb-2">{variation.improvements}</p>
                      <button
                        onClick={() => applyRestructuring(variation)}
                        className="w-full px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                      >
                        Apply This Version
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History Panel */}
            {showHistory && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg">Edit History</h3>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                {editHistory.length === 0 ? (
                  <p className="text-gray-600 text-sm">No saved versions yet</p>
                ) : (
                  <div className="space-y-2">
                    {editHistory.slice().reverse().map((version, index) => (
                      <div key={index} className="p-2 bg-white rounded border border-gray-200">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs text-gray-600">
                            {new Date(version.timestamp).toLocaleString()}
                          </span>
                          <span className="text-xs font-medium text-blue-600">{version.note}</span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                          {version.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                        </p>
                        <button
                          onClick={() => restoreVersion(version)}
                          className="w-full px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                        >
                          Restore This Version
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* TipTap styles */}
      <style jsx global>{`
        .ProseMirror {
          min-height: 400px;
          outline: none;
        }
        
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        .ProseMirror strong {
          font-weight: 700;
        }

        .ProseMirror em {
          font-style: italic;
        }

        .ProseMirror ul {
          padding-left: 1.5rem;
          list-style-type: disc;
        }

        .ProseMirror li {
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  );
};

export default CoverLetterEditor;
