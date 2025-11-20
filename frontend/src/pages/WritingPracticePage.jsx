import React, { useState } from 'react';
import { BookOpen, TrendingUp, Lightbulb, Target } from 'lucide-react';
import WritingPracticeSession from '../components/WritingPracticeSession';
import WritingPracticePerformance from '../components/WritingPracticePerformance';
import Card from '../components/Card';
import Button from '../components/Button';

const WritingPracticePage = () => {
  const [activeTab, setActiveTab] = useState('practice'); // 'practice', 'performance', 'guide'

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#4F5348] text-white py-8 mb-6 shadow-md">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-extrabold mb-2" style={{textShadow: '0 2px 8px rgba(0,0,0,0.10)'}}>Interview Response Writing Practice</h1>
          <p className="text-lg text-white opacity-90 font-medium">
            Improve your communication skills with timed practice sessions and AI-powered feedback
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <div className="flex gap-2 bg-white rounded-xl shadow-md p-2">
          <TabButton
            active={activeTab === 'practice'}
            onClick={() => setActiveTab('practice')}
            icon={<BookOpen className="w-5 h-5" />}
            label="Practice"
          />
          <TabButton
            active={activeTab === 'performance'}
            onClick={() => setActiveTab('performance')}
            icon={<TrendingUp className="w-5 h-5" />}
            label="Performance"
          />
          <TabButton
            active={activeTab === 'guide'}
            onClick={() => setActiveTab('guide')}
            icon={<Lightbulb className="w-5 h-5" />}
            label="Guide"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {activeTab === 'practice' && <WritingPracticeSession setActiveTab={setActiveTab} />}
        {activeTab === 'performance' && <WritingPracticePerformance />}
        {activeTab === 'guide' && <GuideTab />}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-colors shadow-sm text-base ${
      active
        ? 'bg-[#4F5348] text-white shadow-md'
        : 'bg-gray-100 text-[#4F5348] hover:bg-[#656A5C] hover:text-white'
    }`}
    style={{ minWidth: '160px' }}
  >
    {icon}
    {label}
  </button>
);

const GuideTab = () => (
  <div className="max-w-4xl mx-auto space-y-6">
    <Card>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Use Writing Practice</h2>
      <div className="prose max-w-none">
        <p className="text-gray-700 mb-4">
          This tool helps you improve your interview responses through structured practice,
          timed exercises, and AI-powered feedback. Here's how to get the most out of it:
        </p>

        <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Getting Started</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Choose your session type (individual question, timed challenge, etc.)</li>
          <li>Select a category relevant to your target role</li>
          <li>Set your difficulty level based on your experience</li>
          <li>Start the session and begin practicing!</li>
        </ol>

        <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">The STAR Method</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <ul className="space-y-2 text-gray-700">
            <li><strong className="text-blue-900">S - Situation:</strong> Set the context for your story</li>
            <li><strong className="text-blue-900">T - Task:</strong> Describe your responsibility or challenge</li>
            <li><strong className="text-blue-900">A - Action:</strong> Explain what YOU did specifically</li>
            <li><strong className="text-blue-900">R - Result:</strong> Share the outcome with metrics when possible</li>
          </ul>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Writing Tips</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Use active voice and strong action verbs (led, developed, implemented)</li>
          <li>Be specific - include numbers, percentages, and concrete details</li>
          <li>Keep responses concise but complete (150-300 words ideal)</li>
          <li>Focus on YOUR contributions, not just team efforts</li>
          <li>Quantify results whenever possible</li>
          <li>Show impact on business, customers, or team</li>
        </ul>

        <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Managing Interview Nerves</h3>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <ul className="space-y-2 text-gray-700">
            <li><strong>Practice regularly:</strong> The more you practice, the more confident you'll feel</li>
            <li><strong>Prepare your stories:</strong> Have 5-7 strong STAR examples ready</li>
            <li><strong>Deep breathing:</strong> Take slow, deep breaths before and during interviews</li>
            <li><strong>Power poses:</strong> Stand in a confident pose for 2 minutes before the interview</li>
            <li><strong>Positive visualization:</strong> Imagine yourself succeeding</li>
            <li><strong>Remember:</strong> The interviewer wants you to do well!</li>
          </ul>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Understanding Your Feedback</h3>
        <p className="text-gray-700 mb-3">
          After submitting each response, you'll receive detailed feedback including:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li><strong>Overall Score:</strong> Your response quality out of 100</li>
          <li><strong>Component Scores:</strong> Clarity, professionalism, structure, relevance, impact</li>
          <li><strong>STAR Analysis:</strong> How well you followed the framework</li>
          <li><strong>Strengths:</strong> What you did well</li>
          <li><strong>Improvements:</strong> Specific areas to enhance</li>
          <li><strong>Alternative Approaches:</strong> Different ways to answer</li>
          <li><strong>Language Patterns:</strong> Analysis of your word choices</li>
        </ul>

        <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Tracking Your Progress</h3>
        <p className="text-gray-700 mb-3">
          Use the Performance tab to:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>View your improvement trend over time</li>
          <li>Identify your strength and focus areas</li>
          <li>Compare different practice sessions</li>
          <li>Track confidence and preparedness levels</li>
          <li>Review recent sessions and scores</li>
        </ul>

        <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Best Practices</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <ul className="space-y-2 text-gray-700">
            <li>✅ Practice consistently - even 15 minutes a day helps</li>
            <li>✅ Focus on one category at a time to build depth</li>
            <li>✅ Review your feedback and implement suggestions</li>
            <li>✅ Time yourself to develop natural pacing</li>
            <li>✅ Practice out loud after writing to hear how it sounds</li>
            <li>✅ Keep a bank of your best stories for different scenarios</li>
            <li>❌ Don't memorize word-for-word - be natural and conversational</li>
            <li>❌ Don't rush - clarity is more important than speed</li>
          </ul>
        </div>
      </div>
    </Card>

    <Card>
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Target className="w-6 h-6 text-blue-600" />
        Category Guide
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { name: 'Leadership', desc: 'Leading teams, making decisions, taking initiative' },
          { name: 'Teamwork', desc: 'Collaborating, communication, supporting others' },
          { name: 'Problem Solving', desc: 'Analyzing issues, finding solutions, innovation' },
          { name: 'Conflict Resolution', desc: 'Handling disagreements, mediation, diplomacy' },
          { name: 'Time Management', desc: 'Prioritization, meeting deadlines, multitasking' },
          { name: 'Communication', desc: 'Presenting, explaining, persuading, listening' },
          { name: 'Adaptability', desc: 'Handling change, learning, flexibility' },
          { name: 'Initiative', desc: 'Proactivity, self-motivation, taking ownership' },
          { name: 'Customer Focus', desc: 'Service orientation, empathy, satisfaction' },
          { name: 'Achievement', desc: 'Goal setting, results, exceeding expectations' },
          { name: 'Technical', desc: 'Technical skills, tools, methodologies' },
          { name: 'Cultural Fit', desc: 'Values alignment, work style, team dynamics' }
        ].map((category, idx) => (
          <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-1">{category.name}</h4>
            <p className="text-sm text-gray-600">{category.desc}</p>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

export default WritingPracticePage;
