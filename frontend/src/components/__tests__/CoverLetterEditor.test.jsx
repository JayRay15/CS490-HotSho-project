import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock axios
vi.mock('../../api/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock TipTap modules
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => null),
  EditorContent: ({ editor }) => <div data-testid="editor-content">Editor</div>,
}));

vi.mock('@tiptap/starter-kit', () => ({
  default: vi.fn(),
}));

vi.mock('@tiptap/extension-placeholder', () => ({
  default: {
    configure: vi.fn(),
  },
}));

import CoverLetterEditor from '../CoverLetterEditor';

describe('CoverLetterEditor', () => {
  it('should render without crashing when editor is null', () => {
    const { container } = render(
      <CoverLetterEditor 
        initialContent="<p>Test content</p>"
        onChange={vi.fn()}
        coverLetterId="test-id"
        onSave={vi.fn()}
      />
    );
    
    expect(container).toBeInTheDocument();
  });
});
