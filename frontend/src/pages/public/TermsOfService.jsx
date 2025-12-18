import { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Terms of Service page for HotSho ATS platform
 */
const TermsOfService = () => {
  const [activeSection, setActiveSection] = useState(null);

  const lastUpdated = "December 18, 2025";
  const effectiveDate = "December 18, 2025";

  const sections = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      content: `By accessing or using the HotSho ATS platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.

These Terms apply to all visitors, users, and others who access or use the Service. By using the Service, you represent that you are at least 18 years of age, or if you are under 18, that you have your parent's or legal guardian's permission to use the Service.`
    },
    {
      id: 'description',
      title: '2. Description of Service',
      content: `HotSho is an Applicant Tracking System designed for job candidates, providing tools to:
• Track job applications across multiple platforms
• Prepare for interviews with AI-powered assistance
• Create and manage resumes and cover letters
• Access salary benchmarks and negotiation tools
• Network with mentors and peers
• Analyze job search performance

The Service is provided "as is" and we reserve the right to modify, suspend, or discontinue any aspect of the Service at any time without notice.`
    },
    {
      id: 'accounts',
      title: '3. User Accounts',
      content: `When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.

You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party.

You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.

We reserve the right to refuse service, terminate accounts, or remove or edit content in our sole discretion.`
    },
    {
      id: 'content',
      title: '4. User Content',
      content: `Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.

By posting Content to the Service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service solely for the purpose of providing the Service to you.

You retain all of your ownership rights in your Content. You represent and warrant that:
• The Content is yours or you have the right to use it
• The posting of your Content does not violate the privacy rights, publicity rights, copyrights, contract rights, or any other rights of any person`
    },
    {
      id: 'prohibited',
      title: '5. Prohibited Uses',
      content: `You agree not to use the Service:
• In any way that violates any applicable law or regulation
• To exploit, harm, or attempt to exploit or harm minors
• To transmit any advertising or promotional material without our prior written consent
• To impersonate or attempt to impersonate another user or person
• To engage in any conduct that restricts or inhibits anyone's use of the Service
• To introduce any viruses, malware, or other harmful material
• To attempt to gain unauthorized access to any portion of the Service
• To use any robot, spider, or other automatic device to access the Service
• To collect or harvest any personally identifiable information from the Service
• To use the Service for any commercial solicitation purposes without our consent`
    },
    {
      id: 'intellectual',
      title: '6. Intellectual Property',
      content: `The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of HotSho and its licensors.

The Service is protected by copyright, trademark, and other laws. Our trademarks may not be used in connection with any product or service without the prior written consent of HotSho.

You acknowledge that any feedback, comments, or suggestions you may provide regarding the Service is entirely voluntary and we will be free to use such feedback as we see fit without any obligation to you.`
    },
    {
      id: 'thirdparty',
      title: '7. Third-Party Services',
      content: `Our Service may contain links to third-party websites or services that are not owned or controlled by HotSho (including but not limited to GitHub, LinkedIn, Google, and job board platforms).

HotSho has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third-party websites or services.

When you connect third-party services to your HotSho account, you grant us permission to access and use information from those services as permitted by those services' terms of use.`
    },
    {
      id: 'termination',
      title: '8. Termination',
      content: `We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including without limitation if you breach the Terms.

Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may do so by contacting us.

All provisions of the Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.`
    },
    {
      id: 'disclaimer',
      title: '9. Disclaimer',
      content: `THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.

HotSho does not warrant that:
• The Service will function uninterrupted or be error-free
• Any errors will be corrected
• The Service is free of viruses or other harmful components
• The results from the use of the Service will meet your requirements

HotSho does not guarantee job placement or interview success. The AI-powered features provide suggestions and analysis only and should not be solely relied upon for making career decisions.`
    },
    {
      id: 'limitation',
      title: '10. Limitation of Liability',
      content: `IN NO EVENT SHALL HOTSHOT, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES, BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
• Your access to or use of or inability to access or use the Service
• Any conduct or content of any third party on the Service
• Any content obtained from the Service
• Unauthorized access, use, or alteration of your transmissions or content

Our total liability shall not exceed the amount you paid to access the Service in the twelve (12) months prior to the claim, or $100 USD, whichever is greater.`
    },
    {
      id: 'governing',
      title: '11. Governing Law',
      content: `These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.

Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.

If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions will remain in effect.`
    },
    {
      id: 'changes',
      title: '12. Changes to Terms',
      content: `We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect.

What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.`
    },
    {
      id: 'contact',
      title: '13. Contact Us',
      content: `If you have any questions about these Terms, please contact us at:

Email: legal@hotshot-ats.com
Support: support@hotshot-ats.com

We aim to respond to all inquiries within 48 business hours.`
    }
  ];

  const toggleSection = (id) => {
    setActiveSection(activeSection === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <p><strong>Last Updated:</strong> {lastUpdated}</p>
            <p><strong>Effective Date:</strong> {effectiveDate}</p>
          </div>
          <p className="mt-4 text-gray-700">
            Please read these Terms of Service carefully before using the HotSho ATS platform.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h2>
          <nav className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {section.title}
              </a>
            ))}
          </nav>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                <svg
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${
                    activeSection === section.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {activeSection === section.id && (
                <div className="px-6 pb-6">
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Links */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link to="/privacy" className="text-blue-600 hover:text-blue-800 hover:underline">
              Privacy Policy
            </Link>
            <span className="text-gray-300">|</span>
            <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 hover:underline">
              Back to Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <a href="mailto:support@hotshot-ats.com" className="text-blue-600 hover:text-blue-800 hover:underline">
              Contact Support
            </a>
          </div>
        </div>

        {/* Agreement Notice */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>By using HotSho, you acknowledge that you have read and understood these Terms of Service.</p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
