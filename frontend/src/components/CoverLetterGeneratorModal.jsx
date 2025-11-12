import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, FileText, Sparkles, Loader2 } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import ExperienceHighlighter from './ExperienceHighlighter';
import { analyzeExperienceForCoverLetter } from '../api/coverLetters';
import { createCoverLetter } from '../api/coverLetters';

const CoverLetterGeneratorModal = ({ job, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Options, 2: Experience Selection, 3: Preview & Save
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1: Options
  const [coverLetterName, setCoverLetterName] = useState('');
  const [style, setStyle] = useState('formal');
  const [maxExperiences, setMaxExperiences] = useState(3);
  const [tone, setTone] = useState('professional');
  const [includeQuantifiedAchievements, setIncludeQuantifiedAchievements] = useState(true);
  
  // Step 2: Experience Analysis
  const [selectedNarratives, setSelectedNarratives] = useState('');
  const [analysis, setAnalysis] = useState(null);
  
  // Step 3: Generated Content
  const [generatedContent, setGeneratedContent] = useState('');

  useEffect(() => {
    if (job) {
      setCoverLetterName(`Cover Letter - ${job.company} - ${job.title}`);
    }
  }, [job]);

  const handleStartAnalysis = async () => {
    if (!coverLetterName.trim()) {
      setError('Please enter a name for your cover letter');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await analyzeExperienceForCoverLetter(job._id, maxExperiences);
      setAnalysis(response.data.data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze experience');
    } finally {
      setLoading(false);
    }
  };

  const handleNarrativesSelected = (narrativesText) => {
    setSelectedNarratives(narrativesText);
    setStep(3);
    generateCoverLetterContent(narrativesText);
  };

  const generateCoverLetterContent = (narratives) => {
    // Generate cover letter structure with the selected narratives
    const today = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });

    const salutationMap = {
      formal: 'Dear Hiring Manager,',
      professional: 'Dear Hiring Team,',
      friendly: 'Hello,',
      enthusiastic: 'Dear Hiring Team,'
    };

    const openingMap = {
      formal: `I am writing to express my strong interest in the ${job.title} position at ${job.company}.`,
      professional: `I am excited to apply for the ${job.title} position at ${job.company}.`,
      friendly: `I'm thrilled to submit my application for the ${job.title} role at ${job.company}.`,
      enthusiastic: `I am incredibly excited about the opportunity to join ${job.company} as a ${job.title}!`
    };

    const closingMap = {
      formal: 'I look forward to the opportunity to discuss how my experience and skills align with your needs.',
      professional: 'I would welcome the opportunity to discuss how I can contribute to your team.',
      friendly: 'I would love to chat more about how I can contribute to your team!',
      enthusiastic: 'I am eager to bring my passion and expertise to your team and would love to discuss this opportunity further!'
    };

    const signOffMap = {
      formal: 'Sincerely,',
      professional: 'Best regards,',
      friendly: 'Thank you,',
      enthusiastic: 'Enthusiastically yours,'
    };

    // Extract key skills from matched requirements
    const allMatchedSkills = [];
    if (analysis?.selectedExperiences) {
      analysis.selectedExperiences.forEach(exp => {
        if (exp.relevance?.matchedSkills) {
          allMatchedSkills.push(...exp.relevance.matchedSkills);
        }
      });
    }
    const topSkills = [...new Set(allMatchedSkills)].slice(0, 5);

    // Build skills paragraph highlighting job requirements alignment
    let skillsParagraph = '';
    if (topSkills.length > 0) {
      const skillsList = topSkills.length > 2 
        ? `${topSkills.slice(0, -1).join(', ')}, and ${topSkills[topSkills.length - 1]}`
        : topSkills.join(' and ');
      
      skillsParagraph = tone === 'formal' 
        ? `My expertise in ${skillsList} directly addresses the key requirements outlined in your job posting. I am particularly drawn to this opportunity as it aligns perfectly with my professional strengths and career objectives.`
        : tone === 'enthusiastic'
        ? `I'm particularly excited about how my skills in ${skillsList} align with your needs! These are areas where I've not only developed expertise but also achieved significant results.`
        : `My background in ${skillsList} aligns well with your requirements, and I'm confident these skills will enable me to make immediate contributions to your team.`;
    }

    // Add requirement connections if available
    let requirementsSection = '';
    if (analysis?.requirementConnections && analysis.requirementConnections.length > 0) {
      const topConnections = analysis.requirementConnections.slice(0, 2);
      const connectionTexts = topConnections.map(conn => {
        const expTitle = conn.experiences[0]?.title || 'my previous role';
        return `As ${expTitle}, I ${conn.requirement.toLowerCase()}`;
      });
      
      if (connectionTexts.length > 0) {
        requirementsSection = `\n\n${connectionTexts.join(', and ')}. These experiences have prepared me to excel in the responsibilities outlined for this position.`;
      }
    }

    const content = `${today}

${salutationMap[tone] || salutationMap.professional}

${openingMap[tone] || openingMap.professional} ${skillsParagraph ? skillsParagraph + '\n' : 'With a proven track record in the industry, I am confident that my background makes me an excellent fit for this role.\n'}
${narratives}${requirementsSection}

${analysis?.packageScore?.gaps?.length > 0 && tone !== 'friendly' ? `While I am actively developing my expertise in ${analysis.packageScore.gaps.slice(0, 2).join(' and ')}, my strong foundation in the core requirements and my proven ability to quickly master new technologies position me to excel in this role.

` : ''}${closingMap[tone] || closingMap.professional}

${signOffMap[tone] || signOffMap.professional}
[Your Name]`;

    setGeneratedContent(content);
  };

  const handleSaveCoverLetter = async () => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        name: coverLetterName,
        content: generatedContent,
        style: style,
        jobId: job._id
      };

      await createCoverLetter(payload);
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save cover letter');
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setAnalysis(null);
    } else if (step === 3) {
      setStep(2);
      setGeneratedContent('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={28} />
              <div>
                <h2 className="text-2xl font-bold">Generate Cover Letter</h2>
                <p className="text-sm text-blue-100 mt-1">
                  {job.title} at {job.company}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                1
              </div>
              <span className="text-sm font-medium">Configure</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                2
              </div>
              <span className="text-sm font-medium">Select Experience</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                3
              </div>
              <span className="text-sm font-medium">Preview & Save</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <Card variant="error" className="mb-4">
              <p className="text-sm">{error}</p>
            </Card>
          )}

          {/* Step 1: Configuration */}
          {step === 1 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <Card title="Cover Letter Configuration" variant="elevated">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Letter Name
                    </label>
                    <input
                      type="text"
                      value={coverLetterName}
                      onChange={(e) => setCoverLetterName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Cover Letter - Company - Position"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Writing Style
                      </label>
                      <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="formal">Formal</option>
                        <option value="professional">Professional</option>
                        <option value="creative">Creative</option>
                        <option value="technical">Technical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tone
                      </label>
                      <select
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="formal">Formal</option>
                        <option value="professional">Professional</option>
                        <option value="friendly">Friendly</option>
                        <option value="enthusiastic">Enthusiastic</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Experiences to Highlight
                    </label>
                    <select
                      value={maxExperiences}
                      onChange={(e) => setMaxExperiences(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="1">1 - Most Relevant Only</option>
                      <option value="2">2 - Top Two</option>
                      <option value="3">3 - Top Three (Recommended)</option>
                      <option value="4">4 - Extended</option>
                      <option value="5">5 - Comprehensive</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="includeQuantified"
                      checked={includeQuantifiedAchievements}
                      onChange={(e) => setIncludeQuantifiedAchievements(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="includeQuantified" className="text-sm text-gray-700">
                      Include quantified achievements (recommended)
                    </label>
                  </div>
                </div>
              </Card>

              <Card variant="info">
                <div className="flex items-start gap-3">
                  <Sparkles className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">AI-Powered Experience Analysis</p>
                    <p>
                      We'll analyze your work experience and automatically select the most relevant experiences
                      for this job, then generate compelling narratives that highlight your achievements.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Step 2: Experience Selection */}
          {step === 2 && analysis && (
            <ExperienceHighlighter
              jobId={job._id}
              analysisData={analysis}
              onSelectNarrative={handleNarrativesSelected}
              onClose={handleBack}
            />
          )}

          {/* Step 3: Preview & Save */}
          {step === 3 && (
            <div className="max-w-3xl mx-auto space-y-6">
              <Card title="Cover Letter Preview" variant="elevated">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Edit Your Cover Letter
                  </label>
                  <textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-serif"
                    rows={20}
                    placeholder="Your cover letter content..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {generatedContent.length} characters
                  </p>
                </div>
              </Card>

              {analysis?.recommendations && analysis.recommendations.length > 0 && (
                <Card title="Tips for Enhancement" variant="info">
                  <ul className="space-y-2 text-sm">
                    {analysis.recommendations.slice(0, 3).map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Sparkles size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{rec.message}</p>
                          <p className="text-gray-600 text-xs mt-0.5">{rec.action}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button variant="secondary" onClick={handleBack} disabled={loading}>
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            {step === 1 && (
              <Button
                variant="primary"
                onClick={handleStartAnalysis}
                disabled={loading || !coverLetterName.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2" size={16} />
                    Analyze Experience
                  </>
                )}
              </Button>
            )}
            {step === 3 && (
              <Button
                variant="primary"
                onClick={handleSaveCoverLetter}
                disabled={loading || !generatedContent.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Saving...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2" size={16} />
                    Save Cover Letter
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

CoverLetterGeneratorModal.propTypes = {
  job: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func
};

export default CoverLetterGeneratorModal;
