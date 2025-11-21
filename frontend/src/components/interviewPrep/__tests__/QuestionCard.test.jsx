import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionCard } from '../../interviewPrep/QuestionCard.jsx';

describe('QuestionCard', () => {
  const baseQuestion = {
    _id: 'q1',
    text: 'Describe a time you led a team through a difficult challenge.',
    category: 'Behavioral',
    difficulty: 'Medium',
    linkedSkills: ['leadership','communication'],
    practiced: false,
    companyContext: 'PrepCo / Technology',
    starGuide: {
      situation: 'Team faced legacy system migration under time pressure.',
      task: 'Outline objective & constraints.',
      action: 'Detail steps, coordination, conflict resolution.',
      result: 'Improved reliability & reduced downtime.'
    }
  };

  it('renders question text and badges', () => {
    render(<QuestionCard q={baseQuestion} onToggle={() => {}} />);
    expect(screen.getByText(/Describe a time/)).toBeInTheDocument();
    expect(screen.getByText('Behavioral')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('PrepCo / Technology')).toBeInTheDocument();
  });

  it('expands STAR guide when Show STAR clicked', () => {
    render(<QuestionCard q={baseQuestion} onToggle={() => {}} />);
    const toggleBtn = screen.getByRole('button', { name: /Show STAR/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Situation/)).toBeInTheDocument();
    expect(screen.getByText(/Team faced legacy system migration/)).toBeInTheDocument();
  });

  it('calls onToggle when practice button clicked', () => {
    const handler = vi.fn();
    render(<QuestionCard q={baseQuestion} onToggle={handler} />);
    const practiceBtn = screen.getByRole('button', { name: /Mark Practiced/i });
    fireEvent.click(practiceBtn);
    expect(handler).toHaveBeenCalledWith('q1');
  });
});
