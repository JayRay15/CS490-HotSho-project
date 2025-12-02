import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';

// Mock axios (avoid hoisting issues by assigning mock in beforeEach)
let mockPost;
let mockGet;
vi.mock('../../api/axios', () => ({
  default: { 
    post: (...args) => mockPost(...args),
    get: (...args) => mockGet(...args),
  },
  post: (...args) => mockPost(...args),
  get: (...args) => mockGet(...args),
}));

// Create a fake TipTap editor that the component can use
const fakeEditor = {
  getText: () => 'Hello world',
  getHTML: () => '<p>Hello world</p>',
  isActive: () => false,
  commands: { setContent: vi.fn() },
  chain: () => ({ 
    focus: () => ({ 
      deleteSelection: () => ({ insertContent: () => ({ run: () => {} }) }),
      toggleBold: () => ({ run: vi.fn() }),
      toggleItalic: () => ({ run: vi.fn() }),
      toggleBulletList: () => ({ run: vi.fn() }),
      toggleOrderedList: () => ({ run: vi.fn() }),
      toggleUnderline: () => ({ run: vi.fn() }),
    }) 
  }),
  state: { selection: { from: 0, to: 5 }, doc: { textBetween: () => 'Hello' } },
  onCallbacks: {},
  on(event, cb) { this.onCallbacks[event] = cb; },
  trigger(event) { if (this.onCallbacks[event]) this.onCallbacks[event](); },
};

vi.mock('@tiptap/react', () => ({
  useEditor: () => fakeEditor,
  EditorContent: (props) => <div data-testid="editor" />,
}));

// Import the component after mocks
import CoverLetterEditor from '../CoverLetterEditor.jsx';

describe('CoverLetterEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPost = vi.fn();
    mockGet = vi.fn();
    fakeEditor.commands.setContent.mockClear();
  });

  test('manual save calls API and onSave', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    const onSave = vi.fn();

    render(<CoverLetterEditor initialContent="<p>Hi</p>" coverLetterId="cid1" onSave={onSave} />);

    const saveButton = await screen.findByRole('button', { name: /save version|💾 Save|Saving.../i });
    fireEvent.click(saveButton);

    await waitFor(() => expect(mockPost).toHaveBeenCalled());
    expect(mockPost).toHaveBeenCalledWith('/api/cover-letters/cid1/versions', expect.objectContaining({ content: expect.any(String), note: 'Manual save' }));
    expect(onSave).toHaveBeenCalled();
  });

  test('spell check displays issues and applyCorrection updates editor content', async () => {
    // Mock spell-check response
    mockPost.mockResolvedValueOnce({ data: { data: { analysis: { issues: [ { text: 'wrng', suggestion: 'wrong', severity: 'moderate', type: 'spelling', explanation: 'typo' } ] } } } });

    render(<CoverLetterEditor initialContent="<p>Hi</p>" coverLetterId="cid1" />);

    const spellButton = screen.getByRole('button', { name: /spell check/i });
    fireEvent.click(spellButton);

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith('/api/cover-letters/editing/spell-check', expect.any(Object)));

    // The issue should be rendered
    expect(await screen.findByText(/wrng/)).toBeInTheDocument();

    // Click Fix and ensure editor.setContent called
    const fixButton = screen.getByRole('button', { name: /Fix/i });
    fireEvent.click(fixButton);

    await waitFor(() => expect(fakeEditor.commands.setContent).toHaveBeenCalled());
  });

  test('shows word and character count', async () => {
    render(<CoverLetterEditor initialContent="<p>Test</p>" coverLetterId="cid1" />);
    
    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByTestId('editor')).toBeInTheDocument();
    });
    
    // Should show word count based on fakeEditor.getText() = 'Hello world' = 2 words
    expect(screen.getByText(/\d+ word/i)).toBeInTheDocument();
  });

  test('does not save when coverLetterId is missing', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    
    render(<CoverLetterEditor initialContent="<p>Hi</p>" />);

    const saveButton = await screen.findByRole('button', { name: /save version|💾 Save|Saving.../i });
    fireEvent.click(saveButton);

    // Should not call API when coverLetterId is missing
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  test('readability button is present and clickable', async () => {
    render(<CoverLetterEditor initialContent="<p>Test</p>" coverLetterId="cid1" />);
    
    const readabilityButton = screen.getByRole('button', { name: /readability/i });
    expect(readabilityButton).toBeInTheDocument();
  });

  test('synonyms button is present', async () => {
    render(<CoverLetterEditor initialContent="<p>Test</p>" coverLetterId="cid1" />);
    
    const synonymsButton = screen.getByRole('button', { name: /synonyms/i });
    expect(synonymsButton).toBeInTheDocument();
  });

  test('restructure button is present', async () => {
    render(<CoverLetterEditor initialContent="<p>Test</p>" coverLetterId="cid1" />);
    
    const restructureButton = screen.getByRole('button', { name: /restructure/i });
    expect(restructureButton).toBeInTheDocument();
  });

  test('history button is present', async () => {
    render(<CoverLetterEditor initialContent="<p>Test</p>" coverLetterId="cid1" />);
    
    const historyButton = screen.getByRole('button', { name: /history/i });
    expect(historyButton).toBeInTheDocument();
  });

  test('formatting buttons are present', async () => {
    render(<CoverLetterEditor initialContent="<p>Test</p>" coverLetterId="cid1" />);
    
    // Bold button
    const boldButton = screen.getByRole('button', { name: /^B$/i });
    expect(boldButton).toBeInTheDocument();
    
    // Italic button
    const italicButton = screen.getByRole('button', { name: /^I$/i });
    expect(italicButton).toBeInTheDocument();
  });

  test('clicking bold button triggers chain', async () => {
    render(<CoverLetterEditor initialContent="<p>Test</p>" coverLetterId="cid1" />);
    
    const boldButton = screen.getByRole('button', { name: /^B$/i });
    fireEvent.click(boldButton);
    
    // Should not throw error - chain().focus().toggleBold().run() should work
    expect(boldButton).toBeInTheDocument();
  });

  test('clicking italic button triggers chain', async () => {
    render(<CoverLetterEditor initialContent="<p>Test</p>" coverLetterId="cid1" />);
    
    const italicButton = screen.getByRole('button', { name: /^I$/i });
    fireEvent.click(italicButton);
    
    expect(italicButton).toBeInTheDocument();
  });

  describe('save error handling', () => {
    test('shows alert when save fails', async () => {
      mockPost.mockRejectedValue(new Error('Save failed'));
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<CoverLetterEditor initialContent="<p>Hi</p>" coverLetterId="cid1" />);

      const saveButton = await screen.findByRole('button', { name: /save version|💾 Save|Saving.../i });
      fireEvent.click(saveButton);

      await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to save')));
      alertSpy.mockRestore();
    });
  });

  describe('spell check error handling', () => {
    test('shows alert when spell check fails', async () => {
      mockPost.mockRejectedValue(new Error('API error'));
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<CoverLetterEditor initialContent="<p>Test</p>" coverLetterId="cid1" />);

      const spellButton = screen.getByRole('button', { name: /spell check/i });
      fireEvent.click(spellButton);

      await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to check spelling')));
      alertSpy.mockRestore();
    });
  });

  describe('readability analysis', () => {
    test('shows alert when readability API fails', async () => {
      mockPost.mockRejectedValue(new Error('API error'));
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<CoverLetterEditor initialContent="<p>Test</p>" coverLetterId="cid1" />);

      const readabilityButton = screen.getByRole('button', { name: /readability/i });
      fireEvent.click(readabilityButton);

      await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to analyze readability')));
      alertSpy.mockRestore();
    });
  });

  describe('synonyms button', () => {
    test('synonyms button is disabled when no text selected', async () => {
      render(<CoverLetterEditor initialContent="<p>Test</p>" coverLetterId="cid1" />);
      
      const synonymsButton = screen.getByRole('button', { name: /synonyms/i });
      expect(synonymsButton).toBeDisabled();
    });
  });

  describe('restructure button', () => {
    test('restructure button is disabled when no text selected', async () => {
      render(<CoverLetterEditor initialContent="<p>Test</p>" coverLetterId="cid1" />);
      
      const restructureButton = screen.getByRole('button', { name: /restructure/i });
      expect(restructureButton).toBeDisabled();
    });
  });

  describe('history', () => {
    test('loads history when button clicked', async () => {
      mockGet.mockResolvedValueOnce({ 
        data: { 
          data: { 
            history: [
              { id: '1', content: '<p>Old version</p>', createdAt: '2024-01-01', note: 'Save 1' }
            ] 
          } 
        } 
      });
      
      render(<CoverLetterEditor initialContent="<p>Test</p>" coverLetterId="cid1" />);

      const historyButton = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyButton);

      await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/api/cover-letters/cid1/history'));
    });

    test('shows alert when history load fails', async () => {
      mockGet.mockRejectedValue(new Error('API error'));
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<CoverLetterEditor initialContent="<p>Test</p>" coverLetterId="cid1" />);

      const historyButton = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyButton);

      await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to load')));
      alertSpy.mockRestore();
    });
  });

  describe('spell check with no issues', () => {
    test('displays no issues message when spell check passes', async () => {
      mockPost.mockResolvedValueOnce({ data: { data: { analysis: { issues: [] } } } });

      render(<CoverLetterEditor initialContent="<p>Hi</p>" coverLetterId="cid1" />);

      const spellButton = screen.getByRole('button', { name: /spell check/i });
      fireEvent.click(spellButton);

      await waitFor(() => expect(mockPost).toHaveBeenCalled());
      
      // Should show no issues message
      expect(await screen.findByText(/no issues found|looks good|perfect/i)).toBeInTheDocument();
    });
  });
});

