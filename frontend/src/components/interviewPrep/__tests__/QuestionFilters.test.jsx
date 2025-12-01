import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionFilters } from '../../interviewPrep/QuestionFilters.jsx';

describe('QuestionFilters', () => {
  const defaultFilters = { 
    categories: new Set(['Behavioral','Technical','Situational']), 
    difficulties: new Set(), 
    practice: 'All', 
    search: '' 
  };

  it('allows toggling category filter', () => {
    const setFilters = vi.fn();
    render(<QuestionFilters filters={defaultFilters} setFilters={setFilters} />);
    const behavioralBtn = screen.getByRole('button', { name: /Behavioral/i });
    fireEvent.click(behavioralBtn);
    expect(setFilters).toHaveBeenCalled();
  });

  it('updates search input', () => {
    let current = { ...defaultFilters, categories: new Set(defaultFilters.categories) };
    const setFilters = (updater) => { current = typeof updater === 'function' ? updater(current) : updater; };
    render(<QuestionFilters filters={current} setFilters={setFilters} />);
    const input = screen.getByPlaceholderText(/Search text or skill/i);
    fireEvent.change(input, { target: { value: 'lead' } });
    expect(current.search).toBe('lead');
  });

  describe('toggleCategory', () => {
    it('removes category when already selected', () => {
      let current = { ...defaultFilters, categories: new Set(['Behavioral', 'Technical', 'Situational']) };
      const setFilters = (updater) => { current = typeof updater === 'function' ? updater(current) : updater; };
      render(<QuestionFilters filters={current} setFilters={setFilters} />);
      
      fireEvent.click(screen.getByRole('button', { name: /Behavioral/i }));
      expect(current.categories.has('Behavioral')).toBe(false);
    });

    it('adds category when not selected', () => {
      let current = { ...defaultFilters, categories: new Set(['Technical', 'Situational']) };
      const setFilters = (updater) => { current = typeof updater === 'function' ? updater(current) : updater; };
      render(<QuestionFilters filters={current} setFilters={setFilters} />);
      
      fireEvent.click(screen.getByRole('button', { name: /Behavioral/i }));
      expect(current.categories.has('Behavioral')).toBe(true);
    });

    it('toggles Technical category', () => {
      let current = { ...defaultFilters, categories: new Set(['Behavioral', 'Technical', 'Situational']) };
      const setFilters = (updater) => { current = typeof updater === 'function' ? updater(current) : updater; };
      render(<QuestionFilters filters={current} setFilters={setFilters} />);
      
      fireEvent.click(screen.getByRole('button', { name: /Technical/i }));
      expect(current.categories.has('Technical')).toBe(false);
    });

    it('toggles Situational category', () => {
      let current = { ...defaultFilters, categories: new Set(['Behavioral', 'Technical', 'Situational']) };
      const setFilters = (updater) => { current = typeof updater === 'function' ? updater(current) : updater; };
      render(<QuestionFilters filters={current} setFilters={setFilters} />);
      
      fireEvent.click(screen.getByRole('button', { name: /Situational/i }));
      expect(current.categories.has('Situational')).toBe(false);
    });
  });

  describe('toggleDifficulty', () => {
    it('adds difficulty when not selected', () => {
      let current = { ...defaultFilters, categories: new Set(defaultFilters.categories), difficulties: new Set() };
      const setFilters = (updater) => { current = typeof updater === 'function' ? updater(current) : updater; };
      render(<QuestionFilters filters={current} setFilters={setFilters} />);
      
      fireEvent.click(screen.getByRole('button', { name: /Easy/i }));
      expect(current.difficulties.has('Easy')).toBe(true);
    });

    it('removes difficulty when already selected', () => {
      let current = { ...defaultFilters, categories: new Set(defaultFilters.categories), difficulties: new Set(['Easy']) };
      const setFilters = (updater) => { current = typeof updater === 'function' ? updater(current) : updater; };
      render(<QuestionFilters filters={current} setFilters={setFilters} />);
      
      fireEvent.click(screen.getByRole('button', { name: /Easy/i }));
      expect(current.difficulties.has('Easy')).toBe(false);
    });

    it('toggles Medium difficulty', () => {
      let current = { ...defaultFilters, categories: new Set(defaultFilters.categories), difficulties: new Set() };
      const setFilters = (updater) => { current = typeof updater === 'function' ? updater(current) : updater; };
      render(<QuestionFilters filters={current} setFilters={setFilters} />);
      
      fireEvent.click(screen.getByRole('button', { name: /Medium/i }));
      expect(current.difficulties.has('Medium')).toBe(true);
    });

    it('toggles Hard difficulty', () => {
      let current = { ...defaultFilters, categories: new Set(defaultFilters.categories), difficulties: new Set() };
      const setFilters = (updater) => { current = typeof updater === 'function' ? updater(current) : updater; };
      render(<QuestionFilters filters={current} setFilters={setFilters} />);
      
      fireEvent.click(screen.getByRole('button', { name: /Hard/i }));
      expect(current.difficulties.has('Hard')).toBe(true);
    });
  });

  describe('practice filter', () => {
    it('updates practice filter when changed to Practiced', () => {
      let current = { ...defaultFilters, categories: new Set(defaultFilters.categories) };
      const setFilters = (updater) => { current = typeof updater === 'function' ? updater(current) : updater; };
      render(<QuestionFilters filters={current} setFilters={setFilters} />);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'Practiced' } });
      expect(current.practice).toBe('Practiced');
    });

    it('updates practice filter when changed to Unpracticed', () => {
      let current = { ...defaultFilters, categories: new Set(defaultFilters.categories) };
      const setFilters = (updater) => { current = typeof updater === 'function' ? updater(current) : updater; };
      render(<QuestionFilters filters={current} setFilters={setFilters} />);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'Unpracticed' } });
      expect(current.practice).toBe('Unpracticed');
    });
  });

  describe('reset button', () => {
    it('resets all filters to defaults when clicked', () => {
      let current = { 
        categories: new Set(['Behavioral']), 
        difficulties: new Set(['Hard']), 
        practice: 'Practiced', 
        search: 'something' 
      };
      const setFilters = (updater) => { current = typeof updater === 'function' ? updater(current) : updater; };
      render(<QuestionFilters filters={current} setFilters={setFilters} />);
      
      fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
      
      expect(current.categories.has('Behavioral')).toBe(true);
      expect(current.categories.has('Technical')).toBe(true);
      expect(current.categories.has('Situational')).toBe(true);
      expect(current.difficulties.size).toBe(0);
      expect(current.practice).toBe('All');
      expect(current.search).toBe('');
    });
  });

  describe('styling', () => {
    it('applies active styling to selected categories', () => {
      const filters = { ...defaultFilters, categories: new Set(['Behavioral']) };
      render(<QuestionFilters filters={filters} setFilters={vi.fn()} />);
      
      const behavioralBtn = screen.getByRole('button', { name: /Behavioral/i });
      expect(behavioralBtn.className).toContain('bg-blue-600');
    });

    it('applies inactive styling to unselected categories', () => {
      const filters = { ...defaultFilters, categories: new Set(['Behavioral']) };
      render(<QuestionFilters filters={filters} setFilters={vi.fn()} />);
      
      const technicalBtn = screen.getByRole('button', { name: /Technical/i });
      expect(technicalBtn.className).toContain('bg-white');
    });

    it('applies active styling to selected difficulties', () => {
      const filters = { ...defaultFilters, categories: new Set(defaultFilters.categories), difficulties: new Set(['Easy']) };
      render(<QuestionFilters filters={filters} setFilters={vi.fn()} />);
      
      const easyBtn = screen.getByRole('button', { name: /Easy/i });
      expect(easyBtn.className).toContain('bg-indigo-600');
    });

    it('applies inactive styling to unselected difficulties', () => {
      const filters = { ...defaultFilters, categories: new Set(defaultFilters.categories), difficulties: new Set() };
      render(<QuestionFilters filters={filters} setFilters={vi.fn()} />);
      
      const easyBtn = screen.getByRole('button', { name: /Easy/i });
      expect(easyBtn.className).toContain('bg-white');
    });
  });
});
