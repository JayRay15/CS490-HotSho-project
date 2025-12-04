import { useState } from 'react';
import { TrendingUp, Lightbulb, BookOpen, Briefcase, Mail, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { analyzeInterviewNotes, updateFollowUp } from '../api/informationalInterview';
import { setAuthToken } from '../api/axios';
import Button from './Button';
import { toast } from 'react-hot-toast';

const InterviewInsightsSummary = ({ interview, onUpdate }) => {
  const { getToken } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [followUpContent, setFollowUpContent] = useState(interview?.followUp?.content || '');

  const refreshToken = async () => {
    const token = await getToken();
    setAuthToken(token);
  };

  const hasNotes = interview?.meetingNotes && interview.meetingNotes.trim().length > 0;
  const hasInsights = interview?.insights?.keyTakeaways?.length > 0;

  const handleAnalyze = async () => {
    if (!hasNotes) {
      toast.error('No meeting notes to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      await refreshToken();
      await analyzeInterviewNotes(interview._id);
      toast.success('Insights extracted!');
      onUpdate?.();
    } catch (error) {
      console.error('Error analyzing notes:', error);
      toast.error(error.response?.data?.message || 'Failed to analyze notes');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMarkFollowUpSent = async () => {
    setIsSendingFollowUp(true);
    try {
      await refreshToken();
      await updateFollowUp(interview._id, {
        status: 'Sent',
        content: followUpContent,
        sentDate: new Date()
      });
      toast.success('Follow-up marked as sent!');
      onUpdate?.();
    } catch (error) {
      console.error('Error updating follow-up:', error);
      toast.error(error.response?.data?.message || 'Failed to update follow-up');
    } finally {
      setIsSendingFollowUp(false);
    }
  };

  if (!hasNotes) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notes Yet</h3>
        <p className="text-gray-600">
          Add meeting notes to generate AI-powered insights and track opportunities.
        </p>
      </div>
    );
  }

  if (!hasInsights) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Lightbulb className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Analyze</h3>
        <p className="text-gray-600 mb-6">
          Extract key insights, opportunities, and action items from your meeting notes using AI.
        </p>
        <Button onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Notes...
            </>
          ) : (
            <>
              <Lightbulb className="w-4 h-4 mr-2" />
              Analyze Notes
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Takeaways */}
      {interview.insights.keyTakeaways?.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Key Takeaways</h3>
          </div>
          <ul className="space-y-2">
            {interview.insights.keyTakeaways.map((takeaway, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1">•</span>
                <span className="text-gray-700">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Industry Trends */}
      {interview.insights.industryTrends?.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Industry Trends</h3>
          </div>
          <ul className="space-y-2">
            {interview.insights.industryTrends.map((trend, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">{trend}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Resources */}
      {interview.insights.recommendedResources?.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recommended Resources</h3>
          </div>
          <ul className="space-y-2">
            {interview.insights.recommendedResources.map((resource, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span className="text-gray-700">{resource}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Potential Opportunities */}
      {interview.insights.potentialOpportunities?.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Potential Opportunities</h3>
          </div>
          <ul className="space-y-2">
            {interview.insights.potentialOpportunities.map((opportunity, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span className="text-gray-700">{opportunity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Follow-up Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-md p-6 border border-indigo-100">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Follow-up</h3>
          {interview.followUp?.status === 'Sent' && (
            <span className="ml-auto flex items-center gap-1 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              Sent
            </span>
          )}
        </div>

        {interview.followUp?.dueDate && (
          <p className="text-sm text-gray-600 mb-3">
            Due: {new Date(interview.followUp.dueDate).toLocaleDateString()}
          </p>
        )}

        <textarea
          value={followUpContent}
          onChange={(e) => setFollowUpContent(e.target.value)}
          placeholder="Thank you note / follow-up email content..."
          rows={6}
          className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none mb-4"
          disabled={interview.followUp?.status === 'Sent'}
        />

        {interview.followUp?.status !== 'Sent' && (
          <Button
            onClick={handleMarkFollowUpSent}
            disabled={isSendingFollowUp || !followUpContent}
            className="w-full"
          >
            {isSendingFollowUp ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Follow-up as Sent
              </>
            )}
          </Button>
        )}
      </div>

      {/* Re-analyze button */}
      <div className="text-center">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="text-sm text-indigo-600 hover:text-indigo-700 underline"
        >
          {isAnalyzing ? 'Re-analyzing...' : 'Re-analyze notes'}
        </button>
      </div>
    </div>
  );
};

export default InterviewInsightsSummary;
