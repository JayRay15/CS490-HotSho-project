import { useState, useEffect } from 'react';
import { X, Sparkles, Send, Copy, CheckCircle, Mail, MessageSquare, Linkedin } from 'lucide-react';
import Button from '../Button';
import { toast } from 'react-hot-toast';

const OUTREACH_TEMPLATES = {
  '2nd Degree': {
    subject: 'Introduction via Mutual Connection',
    template: (contact) => `Hi ${contact.firstName},

I hope this message finds you well! I noticed we're connected through ${contact.mutualConnections?.[0] || 'a mutual connection'}, and I was really impressed by your work as ${contact.jobTitle} at ${contact.company}.

I'm currently exploring opportunities in the ${contact.industry} space and would love to learn more about your experience. Your background in ${contact.interests?.[0] || 'the industry'} particularly caught my attention.

Would you be open to a brief 15-20 minute conversation sometime in the next few weeks? I'd be grateful for any insights you could share about your career path and the industry landscape.

Thank you for considering my request!

Best regards`
  },
  '3rd Degree': {
    subject: 'Networking Request - Shared Industry Interest',
    template: (contact) => `Hi ${contact.firstName},

I came across your profile and was impressed by your role as ${contact.jobTitle} at ${contact.company}. I'm currently exploring the ${contact.industry} industry and am eager to connect with professionals who have valuable experience in this field.

I noticed we share interests in ${contact.interests?.slice(0, 2).join(' and ') || 'similar areas'}, and I believe there could be great value in connecting.

Would you be open to a brief virtual coffee chat? I'd love to hear about your journey and any advice you might have for someone looking to grow in this space.

Looking forward to potentially connecting!

Best regards`
  },
  'Alumni': {
    subject: 'Fellow Alumni Reaching Out',
    template: (contact) => `Hi ${contact.firstName},

I hope you're doing well! I noticed that we both attended ${contact.university}, and I wanted to reach out as a fellow alum.

Your career path as ${contact.jobTitle} at ${contact.company} is really inspiring, and I'd love to learn more about how you navigated your journey from ${contact.university} to where you are today.

As someone interested in ${contact.industry}, I would greatly appreciate any insights you could share about breaking into the field and building a successful career.

Would you have 15-20 minutes for a quick chat sometime? I promise to be respectful of your time!

Go ${contact.university?.split(' ')[0] || 'team'}! 🎓

Best regards`
  },
  'Industry Leader': {
    subject: 'Admiring Your Work in ${contact.industry}',
    template: (contact) => `Dear ${contact.firstName},

I've been following your work in the ${contact.industry} industry, and I'm truly inspired by your accomplishments as ${contact.jobTitle} at ${contact.company}.

Your insights on ${contact.interests?.[0] || 'industry trends'} have been particularly valuable to me as I develop my own career in this space.

I understand you must be incredibly busy, but if you ever have a few minutes for a brief conversation, I would be honored to learn from your experience. I'm especially curious about ${contact.interests?.[1] || 'your career journey'} and how you've navigated the evolving landscape.

Thank you for the value you bring to our industry!

Respectfully`
  },
  'Conference Speaker': {
    subject: 'Inspired by Your Recent Talk',
    template: (contact) => `Hi ${contact.firstName},

I recently had the pleasure of learning about your speaking work on ${contact.speakerTopics?.[0] || 'industry topics'}. Your perspectives on ${contact.speakerTopics?.[1] || contact.interests?.[0] || 'the field'} were truly eye-opening.

As someone passionate about ${contact.industry}, I found your insights incredibly valuable and would love the opportunity to discuss some of the ideas you shared.

Would you be open to a brief conversation? I have some specific questions about ${contact.speakerTopics?.[0] || 'the topics you covered'} that I think could really help me in my career development.

Thank you for sharing your knowledge with the community!

Best regards`
  },
  'Company Employee': {
    subject: 'Learning About Life at ${contact.company}',
    template: (contact) => `Hi ${contact.firstName},

I hope this message finds you well! I'm very interested in ${contact.company} and noticed your role as ${contact.jobTitle}. The company's work in ${contact.industry} really aligns with my career interests.

I'm exploring opportunities in this space and would love to learn more about the culture and your experience at ${contact.company}. Your perspective as someone working on the inside would be invaluable.

Would you be open to a brief informational conversation? I'd love to hear about:
• What you enjoy most about working at ${contact.company}
• The team dynamics and culture
• Any advice for someone interested in joining

Thank you for considering my request!

Best regards`
  },
  'Diversity Network': {
    subject: 'Connecting Through Our Shared Community',
    template: (contact) => `Hi ${contact.firstName},

I came across your profile and was excited to see that we're both part of ${contact.diversityGroups?.[0] || 'similar professional communities'}. It's always wonderful to connect with fellow professionals who share our commitment to building an inclusive industry.

Your work as ${contact.jobTitle} at ${contact.company} is inspiring, and I'd love to hear more about your journey and how our community has supported your career growth.

Would you be open to connecting for a brief conversation? I believe we could have a meaningful exchange about navigating the ${contact.industry} industry and supporting each other's professional development.

Looking forward to potentially connecting!

Warm regards`
  }
};

const DEFAULT_TEMPLATE = {
  subject: 'Professional Networking Request',
  template: (contact) => `Hi ${contact.firstName},

I hope this message finds you well. I came across your profile and was impressed by your work as ${contact.jobTitle} at ${contact.company}.

I'm currently exploring opportunities in the ${contact.industry} space and am always looking to connect with professionals who have valuable experience and insights.

Would you be open to a brief conversation? I'd love to learn more about your career journey and any advice you might have.

Thank you for your time!

Best regards`
};

export default function OutreachModal({ isOpen, onClose, contact }) {
  const [messageContent, setMessageContent] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('email');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (isOpen && contact) {
      generateTemplate();
    }
  }, [isOpen, contact]);

  const generateTemplate = () => {
    setGenerating(true);
    
    // Small delay for UX
    setTimeout(() => {
      const templateConfig = OUTREACH_TEMPLATES[contact.connectionType] || DEFAULT_TEMPLATE;
      const generatedSubject = templateConfig.subject.replace('${contact.industry}', contact.industry || 'the industry')
                                                       .replace('${contact.company}', contact.company || 'your company');
      const generatedMessage = templateConfig.template(contact);
      
      setSubject(generatedSubject);
      setMessageContent(generatedMessage);
      setGenerating(false);
    }, 500);
  };

  const handleCopy = () => {
    const fullMessage = selectedChannel === 'email' 
      ? `Subject: ${subject}\n\n${messageContent}`
      : messageContent;
    
    navigator.clipboard.writeText(fullMessage);
    setCopied(true);
    toast.success('Message copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendEmail = () => {
    const mailtoLink = `mailto:${contact.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageContent)}`;
    window.open(mailtoLink, '_blank');
    toast.success('Opening email client...');
  };

  const handleOpenLinkedIn = () => {
    if (contact.linkedInUrl) {
      window.open(contact.linkedInUrl, '_blank');
      toast.success('Opening LinkedIn profile...');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.48)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Initiate Outreach</h2>
            <p className="text-sm text-gray-600">
              Personalized message for {contact.fullName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Info Card */}
          <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-lg">
              {contact.firstName?.[0] || '?'}{contact.lastName?.[0] || ''}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{contact.fullName}</h3>
              <p className="text-sm text-gray-600">{contact.jobTitle} at {contact.company}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  contact.connectionType === 'Alumni' ? 'bg-purple-100 text-purple-700' :
                  contact.connectionType === '2nd Degree' ? 'bg-blue-100 text-blue-700' :
                  contact.connectionType === 'Company Employee' ? 'bg-indigo-100 text-indigo-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {contact.connectionType}
                </span>
                {contact.mutualConnectionCount > 0 && (
                  <span className="text-xs text-gray-500">
                    {contact.mutualConnectionCount} mutual connection{contact.mutualConnectionCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Channel Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Outreach Channel
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedChannel('email')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
                  selectedChannel === 'email'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Mail size={18} />
                Email
              </button>
              <button
                onClick={() => setSelectedChannel('linkedin')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
                  selectedChannel === 'linkedin'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Linkedin size={18} />
                LinkedIn
              </button>
              <button
                onClick={() => setSelectedChannel('message')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
                  selectedChannel === 'message'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <MessageSquare size={18} />
                Direct Message
              </button>
            </div>
          </div>

          {/* AI Generation Indicator */}
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-lg p-3">
            <Sparkles size={16} />
            <span>AI-generated template based on {contact.connectionType} connection type</span>
            <button
              onClick={generateTemplate}
              disabled={generating}
              className="ml-auto text-xs underline hover:no-underline"
            >
              {generating ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>

          {/* Subject Line (for email) */}
          {selectedChannel === 'email' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Message Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            {generating ? (
              <div className="w-full h-64 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                  Generating personalized message...
                </div>
              </div>
            ) : (
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              />
            )}
          </div>

          {/* Tips */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">💡 Outreach Tips</h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Personalize the message with specific details about their work</li>
              <li>• Keep it concise - aim for 3-4 short paragraphs</li>
              <li>• Be specific about what you're asking for (e.g., 15-min call)</li>
              <li>• Follow up if you don't hear back within a week</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCopy}
              className="flex items-center gap-2"
            >
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Message'}
            </Button>
            {selectedChannel === 'email' && contact.email && (
              <Button
                onClick={handleSendEmail}
                className="flex items-center gap-2"
              >
                <Send size={16} />
                Open in Email
              </Button>
            )}
            {selectedChannel === 'linkedin' && contact.linkedInUrl && (
              <Button
                onClick={handleOpenLinkedIn}
                className="flex items-center gap-2"
              >
                <Linkedin size={16} />
                Open LinkedIn
              </Button>
            )}
            {(selectedChannel === 'message' || (selectedChannel === 'email' && !contact.email) || (selectedChannel === 'linkedin' && !contact.linkedInUrl)) && (
              <Button
                onClick={handleCopy}
                className="flex items-center gap-2"
              >
                <Copy size={16} />
                Copy to Use
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
