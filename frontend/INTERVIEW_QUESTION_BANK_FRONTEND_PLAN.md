## Interview Question Bank Frontend Integration Plan

### Overview
Implements browsing, filtering, practicing, and progress tracking for curated interview questions (Behavioral, Technical, Situational) generated per job. Data comes from backend `/api/interview-question-bank` endpoints.

### Endpoints
1. `POST /api/interview-question-bank/generate` { jobId }
   - Generates or regenerates the question bank for a job.
2. `GET /api/interview-question-bank` → list of banks (for sidebar/dashboard aggregation)
3. `GET /api/interview-question-bank/job/:jobId` → specific bank for active job
4. `PATCH /api/interview-question-bank/:id/question/:questionId/practice` → toggle practiced state
5. `DELETE /api/interview-question-bank/:id` → remove (optional cleanup)

### Data Shape (Simplified)
```ts
interface InterviewQuestionBank {
  _id: string;
  userId: string;
  jobId: string;
  roleTitle?: string;
  company?: string;
  industry?: string;
  workMode?: string;
  questions: Question[];
  stats: {
    total: number;
    practicedCount: number;
    byCategory: { Behavioral: number; Technical: number; Situational: number };
    byDifficulty: { Easy: number; Medium: number; Hard: number };
  };
}

interface Question {
  _id: string;
  text: string;
  category: 'Behavioral' | 'Technical' | 'Situational';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  linkedSkills: string[];
  companyContext?: string;
  practiced: boolean;
  lastPracticedAt?: string;
  starGuide?: { situation: string; task: string; action: string; result: string };
}
```

### UI Components
1. Job Detail Tab: "Interview Prep"
   - Generate (if missing) or Regenerate button.
   - Stats summary chips (Total, Practiced %, Category counts, Difficulty distribution).
2. Filter Bar
   - Category toggles (Behavioral / Technical / Situational)
   - Difficulty multiselect (Easy / Medium / Hard)
   - Practiced state (All / Practiced / Unpracticed)
   - Free-text search (question text / skill)
3. Question List
   - Expandable cards: question text, difficulty badge, skill tags.
   - Behavioral: show collapsible STAR guidance panel (placeholder text prompts user to fill reflections).
   - Practice toggle button (updates practiced state immediately; optimistic UI with toast on success/fail).
4. Progress Panel
   - Pie or radial chart (practiced vs remaining).
   - Bar chart: category distribution.
   - Stacked bar or segmented badges for difficulty.
5. Skill Heatmap (Optional Future)
   - Frequency of linkedSkills across questions; highlight gaps vs job requirements.

### State Management
Recommended: React Query or custom hooks.
Hooks:
`useQuestionBank(jobId)` → fetch + cache bank.
`usePracticeToggle(bankId)` → mutation for practice endpoint.
Invalidation Logic:
 - After practice toggle, update local state (optimistic) and recompute stats client-side; optionally refetch for consistency.

### Generate Flow
1. User opens Job → Interview Prep tab.
2. If no bank found (`GET /job/:jobId` 404): show empty state with Generate button.
3. On Generate → POST `/generate` → store result → render list.
4. Regenerate button confirmation modal (warns will overwrite practiced flags).

### Filtering Implementation
Maintain derived list in memoized selector:
```ts
const filtered = questions.filter(q => {
  if (activeCategories.size && !activeCategories.has(q.category)) return false;
  if (difficultyFilter.size && !difficultyFilter.has(q.difficulty)) return false;
  if (practiceFilter === 'Practiced' && !q.practiced) return false;
  if (practiceFilter === 'Unpracticed' && q.practiced) return false;
  if (search && !q.text.toLowerCase().includes(search) && !q.linkedSkills.some(s => s.includes(search))) return false;
  return true;
});
```

### STAR Guidance Usage
Behavioral question cards: show 4 collapsible textareas bound to local draft state per question (not persisted yet). Future endpoint could save reflections.

### Toast & UX Feedback
 - Success on generate/regenerate.
 - Practice toggle: show 'Marked Practiced' or 'Marked Unpracticed'.
 - Error handling: network failures revert optimistic toggle.

### Accessibility Considerations
 - Keyboard toggle for practice button (aria-pressed)
 - Collapsible STAR sections with proper aria-expanded.
 - Color-safe difficulty badges (include text labels).

### Performance Notes
Question count expected modest (<100). Basic client filtering adequate; no pagination needed initially.

### Future Enhancements (Backlog)
 - Persist STAR reflections.
 - Add notes per question.
 - Track answer quality rating / confidence score.
 - Export to Markdown / JSON for offline practice.
 - Bulk mark practiced.

### Minimal Frontend Integration Steps
1. Create `src/hooks/useQuestionBank.ts` (fetch & mutations).
2. Add route/tab in job detail: `/jobs/:id/interview-prep`.
3. Implement components: `QuestionFilters`, `QuestionCard`, `StatsPanel`.
4. Wire generate/regenerate actions.
5. Add practice toggle mutation with optimistic update.
6. QA: Verify filters, counts update, STAR guides visible for Behavioral.

### Acceptance Criteria Mapping
| Criterion | Implementation |
|-----------|----------------|
| Behavioral / Technical / Situational categories | Category badges & filter toggles |
| STAR framework guidance | Behavioral cards show STAR section |
| Industry & company-specific nuance | `companyContext` displayed subtitle |
| Links to job skills | Render `linkedSkills` tags |
| Track practice completion | Practice toggle with stats refresh |
| Difficulty levels | Difficulty badge & filter |
| Browse/filter by role/category | Filters & role header |

---
Use this doc as reference while implementing React components. Update if backend fields evolve.
