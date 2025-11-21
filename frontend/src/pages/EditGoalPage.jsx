import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import GoalForm from '../components/GoalForm';
import { getGoalById } from '../api/goals';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const EditGoalPage = () => {
  const { id } = useParams();
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadGoal();
  }, [id]);

  const loadGoal = async () => {
    try {
      setLoading(true);
      const response = await getGoalById(id);
      setGoal(response.goal);
    } catch (err) {
      console.error('Load Goal Error:', err);
      setError(err.message || 'Failed to load goal');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={error || 'Goal not found'} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <GoalForm goal={goal} isEdit={true} />
    </div>
  );
};

export default EditGoalPage;
