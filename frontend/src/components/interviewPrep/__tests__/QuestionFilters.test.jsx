import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionFilters } from '../../interviewPrep/QuestionFilters.jsx';

describe('QuestionFilters', () => {
  it('allows toggling category filter', () => {
    const setFilters = vi.fn();
    const filters = { categories: new Set(['Behavioral','Technical','Situational']), difficulties: new Set(), practice: 'All', search: '' };
    render(<QuestionFilters filters={filters} setFilters={setFilters} />);
    const behavioralBtn = screen.getByRole('button', { name: /Behavioral/i });
    fireEvent.click(behavioralBtn);
    expect(setFilters).toHaveBeenCalled();
  });

  it('updates search input', () => {
    let current = { categories: new Set(['Behavioral','Technical','Situational']), difficulties: new Set(), practice: 'All', search: '' };
    const setFilters = (updater) => { current = typeof updater === 'function' ? updater(current) : updater; };
    render(<QuestionFilters filters={current} setFilters={setFilters} />);
    const input = screen.getByPlaceholderText(/Search text or skill/i);
    fireEvent.change(input, { target: { value: 'lead' } });
    expect(current.search).toBe('lead');
  });
});
