import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

// Fetch and manage interview question bank lifecycle for a given jobId
export function useInterviewQuestionBank(jobId) {
  const [bank, setBank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    categories: new Set(['Behavioral', 'Technical', 'Situational']),
    difficulties: new Set(),
    practice: 'All', // All | Practiced | Unpracticed
    search: ''
  });

  const fetchBank = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/interview-question-bank/job/${jobId}`);
      if (res.data?.success) {
        setBank(res.data.data);
      } else {
        setBank(null);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setBank(null); // Not generated yet
      } else {
        setError(err.message || 'Failed to load question bank');
      }
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  const generateBank = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const res = await api.post('/api/interview-question-bank/generate', { jobId });
      if (res.data?.success) {
        setBank(res.data.data);
        toast.success('Interview question bank generated');
      } else {
        toast.error(res.data?.message || 'Generation failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation error');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  const togglePractice = useCallback(async (questionId) => {
    if (!bank) return;
    // Optimistic update
    setBank(prev => {
      if (!prev) return prev;
      const copy = { ...prev, questions: prev.questions.map(q => ({ ...q })) };
      const target = copy.questions.find(q => q._id === questionId);
      if (target) {
        target.practiced = !target.practiced;
        target.lastPracticedAt = target.practiced ? new Date().toISOString() : null;
      }
      copy.stats = recomputeStats(copy.questions);
      return copy;
    });
    try {
      const res = await api.patch(`/api/interview-question-bank/${bank._id}/question/${questionId}/practice`);
      if (!res.data?.success) throw new Error('Server rejected update');
      setBank(res.data.data);
      toast.success('Practice status updated');
    } catch (err) {
      toast.error('Failed to update practice status');
      // Refetch to sync
      fetchBank();
    }
  }, [bank, fetchBank]);

  // Filtered derived list
  const filteredQuestions = bank ? bank.questions.filter(q => {
    if (filters.categories.size && !filters.categories.has(q.category)) return false;
    if (filters.difficulties.size && !filters.difficulties.has(q.difficulty)) return false;
    if (filters.practice === 'Practiced' && !q.practiced) return false;
    if (filters.practice === 'Unpracticed' && q.practiced) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!q.text.toLowerCase().includes(s) && !(q.linkedSkills||[]).some(skill => skill.toLowerCase().includes(s))) return false;
    }
    return true;
  }) : [];

  useEffect(() => { fetchBank(); }, [fetchBank]);

  return {
    bank,
    loading,
    error,
    filteredQuestions,
    filters,
    setFilters,
    generateBank,
    togglePractice,
    refetch: fetchBank
  };
}

function recomputeStats(questions) {
  const stats = {
    total: questions.length,
    practicedCount: questions.filter(q => q.practiced).length,
    byCategory: { Behavioral: 0, Technical: 0, Situational: 0 },
    byDifficulty: { Easy: 0, Medium: 0, Hard: 0 }
  };
  questions.forEach(q => {
    if (stats.byCategory[q.category] !== undefined) stats.byCategory[q.category]++;
    if (stats.byDifficulty[q.difficulty] !== undefined) stats.byDifficulty[q.difficulty]++;
  });
  return stats;
}
