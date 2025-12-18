import { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Privacy Policy page for HotSho ATS platform
 */
const PrivacyPolicy = () => {
  const [activeSection, setActiveSection] = useState(null);

  const lastUpdated = "December 18, 2025";
  const effectiveDate = "December 18, 2025";

  const sections = [
    {
      id: 'introduction',
      title: '1. Introduction',
      content: `Welcome to HotSho ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy.

This Privacy Policy describes how we collect, use, store, and share your personal information when you use our Applicant Tracking System platform for job candidates (the "Service").

By using our Service, you consent to the data practices described in this policy. If you do not agree with our policies and practices, please do not use our Service.`
    },
    {
      id: 'collection',
      title: '2. Information We Collect',
      content: `We collect several types of information to provide and improve our Service:

**Personal Information You Provide:**
• Account Information: Name, email address, password (encrypted)
• Profile Information: Professional summary, skills, experience, education
• Contact Information: Phone number, address, LinkedIn profile URL
• Documents: Resumes, cover letters, portfolios you upload
• Job Application Data: Companies, positions, application dates, status updates
• Interview Information: Interview dates, notes, preparation materials

**Information Collected Automatically:**
• Usage Data: Pages visited, features used, time spent on the Service
• Device Information: Browser type, IP address, device type, operating system
• Cookies and Tracking Technologies: Session cookies, analytics data

**Information from Third Parties:**
• GitHub: Repository information, contribution data (if connected)
• LinkedIn: Profile data (if connected)
• Google: Email data for application tracking (if connected, read-only access)
• Calendar Services: Interview scheduling data (if connected)`
    },
    {
      id: 'use',
      title: '3. How We Use Your Information',
      content: `We use the information we collect for the following purposes:

**To Provide the Service:**
• Create and manage your account
• Track your job applications
• Generate resumes, cover letters, and other documents
• Provide interview preparation and coaching
• Display salary benchmarks and analytics

**To Improve and Personalize:**
• Analyze usage patterns to improve features
• Provide personalized recommendations
• Train AI models to improve suggestions (anonymized data only)
• Conduct research and development

**To Communicate:**
• Send service-related announcements
• Respond to your inquiries and support requests
• Send optional newsletters and updates (with your consent)

**To Ensure Security:**
• Detect and prevent fraud, abuse, or security issues
• Enforce our Terms of Service
• Comply with legal obligations`
    },
    {
      id: 'sharing',
      title: '4. Information Sharing and Disclosure',
      content: `We do not sell your personal information to third parties. We may share your information in the following circumstances:

**With Your Consent:**
• When you explicitly authorize sharing (e.g., sharing a resume via public link)
• When you connect third-party services to your account

**Service Providers:**
• Hosting providers (Vercel, Render, MongoDB Atlas)
• Analytics services (for anonymized usage data)
• Error tracking services (Sentry, for debugging)
• Email services (for transactional emails)

**Legal Requirements:**
• To comply with applicable laws, regulations, or legal processes
• To protect the rights, property, or safety of HotSho, our users, or others
• In response to lawful requests by public authorities

**Business Transfers:**
• In connection with a merger, acquisition, or sale of assets, your information may be transferred

**Aggregated/Anonymized Data:**
• We may share aggregated or anonymized data that cannot identify you for research, analytics, or other purposes`
    },
    {
      id: 'storage',
      title: '5. Data Storage and Security',
      content: `**Data Storage:**
• Your data is stored on secure servers provided by MongoDB Atlas and our hosting providers
• Data is stored in the United States and may be processed in other locations where our service providers operate

**Security Measures:**
• Encryption: All data is encrypted in transit (TLS/SSL) and at rest
• Authentication: Secure password hashing using bcrypt
• Access Control: Role-based access to systems and data
• CSRF Protection: Protection against cross-site request forgery
• XSS Prevention: Input sanitization to prevent cross-site scripting
• Regular Audits: Security reviews and dependency updates

**Data Breach Notification:**
• In the event of a data breach that may affect your personal information, we will notify you via email within 72 hours of discovery`
    },
    {
      id: 'retention',
      title: '6. Data Retention',
      content: `We retain your personal information for as long as necessary to:
• Provide the Service to you
• Comply with legal obligations
• Resolve disputes and enforce agreements

**Retention Periods:**
• Active Accounts: Data retained while your account is active
• Deleted Accounts: Personal data deleted within 30 days of account deletion
• Backup Data: May be retained in backups for up to 90 days
• Anonymized Data: May be retained indefinitely for analytics and research

**Account Deletion:**
• You may request deletion of your account and associated data at any time
• Some information may be retained to comply with legal obligations or resolve disputes`
    },
    {
      id: 'rights',
      title: '7. Your Rights and Choices',
      content: `Depending on your location, you may have the following rights regarding your personal information:

**Access and Portability:**
• Request a copy of your personal data
• Export your data in a machine-readable format

**Correction:**
• Update or correct inaccurate personal information

**Deletion:**
• Request deletion of your personal information
• Delete your account and associated data

**Restriction and Objection:**
• Request restriction of processing in certain circumstances
• Object to processing based on legitimate interests

**Withdraw Consent:**
• Withdraw consent for optional data processing (e.g., marketing emails)

**To Exercise Your Rights:**
• Contact us at privacy@hotshot-ats.com
• Use account settings to manage preferences
• We will respond to requests within 30 days`
    },
    {
      id: 'cookies',
      title: '8. Cookies and Tracking Technologies',
      content: `We use cookies and similar tracking technologies to collect and track information about your use of the Service.

**Types of Cookies We Use:**
• Essential Cookies: Required for the Service to function (authentication, security)
• Functional Cookies: Remember your preferences and settings
• Analytics Cookies: Help us understand how you use the Service

**Cookie Management:**
• You can control cookies through your browser settings
• Disabling essential cookies may prevent the Service from functioning properly
• We do not use third-party advertising cookies

**Do Not Track:**
• We do not currently respond to "Do Not Track" signals
• We do not track users across third-party websites`
    },
    {
      id: 'thirdparty',
      title: '9. Third-Party Services',
      content: `Our Service integrates with third-party services that have their own privacy policies:

**Integrated Services:**
• GitHub: https://docs.github.com/en/site-policy/privacy-policies
• Google (Gmail/Calendar): https://policies.google.com/privacy
• LinkedIn: https://www.linkedin.com/legal/privacy-policy

**Service Providers:**
• MongoDB Atlas: Database hosting
• Vercel: Frontend hosting
• Render: Backend hosting
• Sentry: Error tracking

When you connect third-party services, you are subject to their privacy policies in addition to ours. We encourage you to review their policies before connecting.`
    },
    {
      id: 'children',
      title: '10. Children\'s Privacy',
      content: `Our Service is not intended for users under the age of 16. We do not knowingly collect personal information from children under 16.

If we become aware that we have collected personal information from a child under 16, we will take steps to delete that information promptly.

If you are a parent or guardian and believe your child has provided us with personal information, please contact us at privacy@hotshot-ats.com.`
    },
    {
      id: 'international',
      title: '11. International Data Transfers',
      content: `Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws.

**Safeguards:**
• We use Standard Contractual Clauses where required
• We ensure our service providers maintain appropriate security measures
• We comply with applicable data transfer regulations

**EU/EEA Users:**
If you are in the European Union or European Economic Area, we comply with GDPR requirements for data transfers outside the EU/EEA.`
    },
    {
      id: 'california',
      title: '12. California Privacy Rights (CCPA)',
      content: `If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):

**Right to Know:**
• Categories of personal information collected
• Sources of personal information
• Business purposes for collection
• Categories of third parties with whom we share data

**Right to Delete:**
• Request deletion of personal information we have collected

**Right to Non-Discrimination:**
• We will not discriminate against you for exercising your privacy rights

**Shine the Light:**
• California residents may request information about sharing of personal information with third parties for direct marketing purposes

**Contact for California Residents:**
privacy@hotshot-ats.com`
    },
    {
      id: 'changes',
      title: '13. Changes to This Privacy Policy',
      content: `We may update this Privacy Policy from time to time to reflect changes to our practices or for legal, operational, or regulatory reasons.

**Notification of Changes:**
• We will post the updated policy on this page
• We will update the "Last Updated" date
• For material changes, we will notify you via email or prominent notice on the Service

**Your Continued Use:**
• Continued use of the Service after changes constitutes acceptance of the updated policy
• If you do not agree to the changes, you should stop using the Service`
    },
    {
      id: 'contact',
      title: '14. Contact Us',
      content: `If you have questions or concerns about this Privacy Policy or our data practices, please contact us:

**Privacy Inquiries:**
Email: privacy@hotshot-ats.com

**General Support:**
Email: support@hotshot-ats.com

**Mailing Address:**
HotSho ATS
[Address to be added]

**Data Protection Officer:**
For GDPR-related inquiries: dpo@hotshot-ats.com

We aim to respond to all inquiries within 30 days.`
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <p><strong>Last Updated:</strong> {lastUpdated}</p>
            <p><strong>Effective Date:</strong> {effectiveDate}</p>
          </div>
          <p className="mt-4 text-gray-700">
            Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
          </p>
        </div>

        {/* Quick Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Privacy at a Glance</h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>We don't sell your data.</strong> Your personal information is never sold to third parties.</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Your data is encrypted.</strong> All data is encrypted in transit and at rest.</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>You control your data.</strong> You can access, export, or delete your data at any time.</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>GDPR & CCPA compliant.</strong> We respect privacy regulations worldwide.</span>
            </li>
          </ul>
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
            <Link to="/terms" className="text-blue-600 hover:text-blue-800 hover:underline">
              Terms of Service
            </Link>
            <span className="text-gray-300">|</span>
            <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 hover:underline">
              Back to Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <a href="mailto:privacy@hotshot-ats.com" className="text-blue-600 hover:text-blue-800 hover:underline">
              Contact Privacy Team
            </a>
          </div>
        </div>

        {/* Agreement Notice */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>By using HotSho, you acknowledge that you have read and understood this Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
