import { useState, useEffect } from 'react';
import { Lightbulb, BookOpen, Loader2, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { generatePrepQuestions, logMeetingNotes } from '../api/informationalInterview';
import { setAuthToken } from '../api/axios';
import Button from './Button';
import { toast } from 'react-hot-toast';

const InterviewPrepWorkspace = ({ interview, onUpdate }) => {
  const { getToken } = useAuth();
  const [specificGoal, setSpecificGoal] = useState('');
  const [questions, setQuestions] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState(interview?.meetingNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const refreshToken = async () => {
    const token = await getToken();
    setAuthToken(token);
  };

  useEffect(() => {
    if (interview?.preparation?.questions?.length > 0) {
      // Reconstruct TIARA structure from flat questions array
      const prepQuestions = interview.preparation.questions;
      setQuestions({
        icebreaker: prepQuestions[0] || '',
        trends: prepQuestions.slice(1, 2),
        insights: prepQuestions.slice(2, 4),
        advice: prepQuestions.slice(4, 6),
        resources: prepQuestions.slice(6, 7),
        assignments: prepQuestions.slice(7, 8),
        closer: prepQuestions[prepQuestions.length - 1] || ''
      });
    }
    setMeetingNotes(interview?.meetingNotes || '');
  }, [interview]);

  const handleGenerateQuestions = async () => {
    if (!specificGoal) {
      toast.error('Please enter your specific goal');
      return;
    }

    setIsGenerating(true);
    try {
      await refreshToken();
      const response = await generatePrepQuestions(interview._id, specificGoal);
      setQuestions(response.data?.questions || response.questions);
      toast.success('Questions generated!');
      onUpdate?.();
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error(error.response?.data?.message || 'Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await refreshToken();
      await logMeetingNotes(interview._id, {
        meetingNotes,
        status: interview.status === 'Scheduled' ? 'Completed' : interview.status
      });
      setLastSaved(new Date());
      toast.success('Notes saved!');
      onUpdate?.();
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error(error.response?.data?.message || 'Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Panel: Framework & Questions */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">TIARA Framework</h3>
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <span className="font-semibold text-indigo-600">T</span>rends: Industry and role trends, future outlook
            </div>
            <div>
              <span className="font-semibold text-indigo-600">I</span>nsights: Day-to-day realities and insider knowledge
            </div>
            <div>
              <span className="font-semibold text-indigo-600">A</span>dvice: Career guidance and recommendations
            </div>
            <div>
              <span className="font-semibold text-indigo-600">R</span>esources: Books, courses, people to follow
            </div>
            <div>
              <span className="font-semibold text-indigo-600">A</span>ssignments: Next steps and actionable items
            </div>
          </div>
        </div>

        {!questions ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Questions</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What do you want to learn?
                </label>
                <textarea
                  value={specificGoal}
                  onChange={(e) => setSpecificGoal(e.target.value)}
                  placeholder="E.g., 'Understand what skills are most valuable for product managers in fintech'"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
              <Button
                onClick={handleGenerateQuestions}
                disabled={isGenerating || !specificGoal}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Generate Strategic Questions
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Your Questions</h3>
              <button
                onClick={() => setQuestions(null)}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Regenerate
              </button>
            </div>
            <div className="space-y-4">
              {/* Icebreaker */}
              {questions.icebreaker && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Icebreaker</p>
                  <p className="text-sm text-gray-800">{questions.icebreaker}</p>
                </div>
              )}

              {/* Trends */}
              {questions.trends?.map((q, idx) => (
                <div key={`trend-${idx}`} className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs font-semibold text-purple-700 uppercase mb-1">Trends</p>
                  <p className="text-sm text-gray-800">{q}</p>
                </div>
              ))}

              {/* Insights */}
              {questions.insights?.map((q, idx) => (
                <div key={`insight-${idx}`} className="p-3 bg-indigo-50 rounded-lg">
                  <p className="text-xs font-semibold text-indigo-700 uppercase mb-1">Insights</p>
                  <p className="text-sm text-gray-800">{q}</p>
                </div>
              ))}

              {/* Advice */}
              {questions.advice?.map((q, idx) => (
                <div key={`advice-${idx}`} className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs font-semibold text-green-700 uppercase mb-1">Advice</p>
                  <p className="text-sm text-gray-800">{q}</p>
                </div>
              ))}

              {/* Resources */}
              {questions.resources?.map((q, idx) => (
                <div key={`resource-${idx}`} className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs font-semibold text-yellow-700 uppercase mb-1">Resources</p>
                  <p className="text-sm text-gray-800">{q}</p>
                </div>
              ))}

              {/* Assignments */}
              {questions.assignments?.map((q, idx) => (
                <div key={`assignment-${idx}`} className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-xs font-semibold text-orange-700 uppercase mb-1">Next Steps</p>
                  <p className="text-sm text-gray-800">{q}</p>
                </div>
              ))}

              {/* Closer */}
              {questions.closer && (
                <div className="p-3 bg-pink-50 rounded-lg">
                  <p className="text-xs font-semibold text-pink-700 uppercase mb-1">Closing</p>
                  <p className="text-sm text-gray-800">{questions.closer}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel: Active Notes */}
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Meeting Notes</h3>
            {lastSaved && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="w-3 h-3" />
                Saved {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
          <textarea
            value={meetingNotes}
            onChange={(e) => setMeetingNotes(e.target.value)}
            placeholder="Take notes during your conversation...

Some tips:
• Capture specific examples and stories
• Note any job opportunities or leads mentioned
• Record recommended resources (books, people, tools)
• Write down follow-up action items
• Track any referrals or introductions offered"
            rows={20}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-mono text-sm"
          />
          <Button
            onClick={handleSaveNotes}
            disabled={isSaving}
            className="w-full mt-4"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Notes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewPrepWorkspace;
