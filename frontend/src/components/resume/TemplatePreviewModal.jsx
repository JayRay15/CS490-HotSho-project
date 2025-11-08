/**
 * Full-page template preview modal
 * Displays a detailed preview of a resume template with sample content
 */

import React from 'react';

function TemplatePreviewModal({ template, onClose }) {
  if (!template) return null;
  const theme = template.theme || { colors: { primary: "#4F5348", text: "#222", muted: "#666" } };
  const layout = template.layout || { sectionsOrder: ["summary","experience","skills","education","projects"] };
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-2xl font-heading font-semibold">Preview: {template.name}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-8 bg-gray-100">
          {/* Simulated resume page - Document style */}
          <div 
            className="bg-white shadow-lg mx-auto"
            style={{ maxWidth: "8.5in", minHeight: "11in", padding: "0.75in" }}
          >
            {/* Header */}
            <div className="text-center mb-8 pb-6 border-b-2" style={{ borderColor: theme.colors?.primary }}>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#2C2C2C', fontFamily: 'Georgia, serif' }}>
                JANE DOE
              </h1>
              <p className="text-sm" style={{ color: '#666', fontFamily: 'Times New Roman, serif' }}>
                jane.doe@email.com • (555) 987-6543 • New York, NY • linkedin.com/in/janedoe
              </p>
            </div>

            {layout.sectionsOrder?.map((section) => (
              <div key={section} className="mb-6">
                <h2 
                  className="text-lg font-bold mb-3 uppercase tracking-wide"
                  style={{ color: theme.colors?.primary || '#4F5348', fontFamily: 'Georgia, serif' }}
                >
                  {section === "summary" && "Professional Summary"}
                  {section === "experience" && "Professional Experience"}
                  {section === "skills" && "Technical Skills"}
                  {section === "education" && "Education"}
                  {section === "projects" && "Projects"}
                  {!["summary", "experience", "skills", "education", "projects"].includes(section) && section}
                </h2>
                <div className="text-sm" style={{ color: '#2C2C2C' }}>
                  {section === "summary" && (
                    <p style={{ textAlign: 'justify', lineHeight: '1.6', fontFamily: 'Times New Roman, serif' }}>
                      Results-oriented professional with 8+ years of experience driving innovation and leading cross-functional teams. 
                      Proven track record of delivering high-impact projects and exceeding organizational goals through strategic thinking 
                      and collaborative problem-solving. Expertise in leveraging cutting-edge technologies to optimize processes and 
                      enhance business outcomes.
                    </p>
                  )}
                  {section === "experience" && (
                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>Senior Software Engineer</h3>
                          <span className="text-xs font-semibold" style={{ color: '#666' }}>Jan 2021 - Present</span>
                        </div>
                        <p className="text-sm italic mb-2" style={{ color: '#555', fontFamily: 'Georgia, serif' }}>Tech Solutions Inc., New York, NY</p>
                        <ul className="space-y-1 ml-5" style={{ listStyleType: 'disc', fontFamily: 'Times New Roman, serif' }}>
                          <li>Architected and deployed scalable microservices infrastructure serving 500K+ daily active users</li>
                          <li>Led team of 6 engineers in delivering mission-critical features, improving system performance by 45%</li>
                          <li>Implemented CI/CD pipelines reducing deployment time by 60% and minimizing production incidents</li>
                        </ul>
                      </div>
                      <div>
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>Software Developer</h3>
                          <span className="text-xs font-semibold" style={{ color: '#666' }}>Jun 2018 - Dec 2020</span>
                        </div>
                        <p className="text-sm italic mb-2" style={{ color: '#555', fontFamily: 'Georgia, serif' }}>Digital Innovations LLC, San Francisco, CA</p>
                        <ul className="space-y-1 ml-5" style={{ listStyleType: 'disc', fontFamily: 'Times New Roman, serif' }}>
                          <li>Developed full-stack web applications using modern frameworks, increasing user engagement by 35%</li>
                          <li>Collaborated with product team to design and implement customer-facing features for B2B platform</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {section === "skills" && (
                    <p style={{ lineHeight: '1.6', fontFamily: 'Times New Roman, serif' }}>
                      JavaScript • TypeScript • React • Node.js • Python • Java • MongoDB • PostgreSQL • AWS • Docker • 
                      Kubernetes • CI/CD • Git • Agile/Scrum • REST APIs • GraphQL • Microservices • System Design
                    </p>
                  )}
                  {section === "education" && (
                    <div>
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>Bachelor of Science in Computer Science</h3>
                        <span className="text-xs font-semibold" style={{ color: '#666' }}>May 2018</span>
                      </div>
                      <p className="text-sm italic" style={{ color: '#555', fontFamily: 'Georgia, serif' }}>University of California, Berkeley</p>
                      <p className="text-sm mt-1" style={{ fontFamily: 'Times New Roman, serif' }}>GPA: 3.85/4.0 • Dean's List • Magna Cum Laude</p>
                    </div>
                  )}
                  {section === "projects" && (
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>E-Commerce Platform Redesign</h3>
                        <p className="text-xs italic mb-1" style={{ color: '#666', fontFamily: 'Times New Roman, serif' }}>
                          Technologies: React, Redux, Node.js, Express, PostgreSQL, Stripe API
                        </p>
                        <p style={{ lineHeight: '1.6', fontFamily: 'Times New Roman, serif' }}>
                          Built responsive full-stack e-commerce application with payment processing, inventory management, 
                          and real-time analytics dashboard. Achieved 99.9% uptime and handled 50K+ monthly transactions.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>AI-Powered Task Management System</h3>
                        <p className="text-xs italic mb-1" style={{ color: '#666', fontFamily: 'Times New Roman, serif' }}>
                          Technologies: Python, TensorFlow, React, MongoDB, AWS Lambda
                        </p>
                        <p style={{ lineHeight: '1.6', fontFamily: 'Times New Roman, serif' }}>
                          Developed intelligent task prioritization system using machine learning algorithms. 
                          Improved team productivity by 30% through automated scheduling and smart notifications.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplatePreviewModal;
