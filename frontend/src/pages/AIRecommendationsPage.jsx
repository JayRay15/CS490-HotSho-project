import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AIRecommendationsDashboard from '../components/dashboard/AIRecommendationsDashboard';

const AIRecommendationsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Main Content */}
        <AIRecommendationsDashboard />
      </div>
    </div>
  );
};

export default AIRecommendationsPage;
