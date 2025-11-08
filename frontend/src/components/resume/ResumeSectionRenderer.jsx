import React from 'react';
import RichTextEditor from './RichTextEditor';

/**
 * ResumeSectionRenderer - Component for rendering different resume sections
 * Extracted from ResumeTemplates.jsx to reduce file size
 */

// Helper function to get section display name
export const getSectionName = (sectionType, sectionStyles = {}) => {
  return sectionStyles[sectionType]?.displayName || 
         (sectionType === 'summary' ? 'Professional Summary' :
          sectionType === 'experience' ? 'Professional Experience' :
          sectionType === 'skills' ? 'Technical Skills' :
          sectionType === 'education' ? 'Education' :
          sectionType === 'projects' ? 'Projects' :
          sectionType === 'awards' ? 'Awards' :
          sectionType === 'certifications' ? 'Certifications' :
          sectionType.charAt(0).toUpperCase() + sectionType.slice(1));
};

// Helper function to format dates
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `${month} ${year}`;
};

/**
 * Renders a resume section based on type
 */
export const ResumeSectionRenderer = ({
  sectionType,
  viewingResume,
  resumeTemplate,
  theme,
  sectionFormatting,
  handleRegenerateSection,
  regeneratingSection,
  handleDeleteSkill,
  isEditMode,
  editedContent,
  setEditedContent
}) => {
  const sectionStyles = resumeTemplate.layout?.sectionStyles || {};
  
  const renderSection = (type) => {
    switch (type) {
      case 'summary':
        return renderSummarySection();
      case 'experience':
        return renderExperienceSection();
      case 'skills':
        return renderSkillsSection();
      case 'education':
        return renderEducationSection();
      case 'projects':
        return renderProjectsSection();
      case 'awards':
        return renderAwardsSection();
      case 'certifications':
        return renderCertificationsSection();
      default:
        return null;
    }
  };

  const renderSummarySection = () => {
    if (!viewingResume.sections?.summary) return null;
    const sectionSpacing = resumeTemplate.layout?.sectionSpacing || 24;
    const headerStyle = resumeTemplate.layout?.headerStyle || 'underline';
    const summaryFmt = sectionFormatting['summary'] || {};
    
    return (
      <div key="summary" style={{ marginBottom: `${summaryFmt.spacing ?? sectionSpacing}px` }}>
        <div className="flex justify-between items-center mb-3">
          <h2 
            className="font-bold uppercase tracking-wide" 
            style={{ 
              color: theme.colors.primary, 
              fontFamily: theme.fonts.heading, 
              fontSize: theme.fonts.sizes?.sectionHeader || "18px",
              borderBottom: headerStyle === 'underline' ? `2px solid ${theme.colors.primary}` : 'none',
              paddingBottom: headerStyle === 'underline' ? '4px' : '0'
            }}
          >
            {getSectionName('summary', sectionStyles)}
          </h2>
          {viewingResume.metadata?.generatedAt && (
            <button
              onClick={() => handleRegenerateSection('summary')}
              disabled={regeneratingSection === 'summary'}
              className="print:hidden text-xs px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition disabled:opacity-50"
            >
              {regeneratingSection === 'summary' ? '⟳ Regenerating...' : '⟳ Regenerate'}
            </button>
          )}
        </div>
        {isEditMode ? (
          <RichTextEditor
            value={editedContent['summary'] || viewingResume.sections.summary}
            onChange={(content) => {
              setEditedContent(prev => ({ ...prev, summary: content }));
            }}
            placeholder="Enter your professional summary..."
            style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fonts.sizes?.body || "14px"
            }}
          />
        ) : (
          <p 
            className="leading-relaxed" 
            style={{ 
              color: summaryFmt.color || theme.colors.text, 
              textAlign: resumeTemplate.layout?.textAlignment || 'justify', 
              fontFamily: theme.fonts.body, 
              fontSize: theme.fonts.sizes?.body || "14px",
              lineHeight: resumeTemplate.layout?.lineHeight || 1.5
            }}
          >
            {viewingResume.sections.summary}
          </p>
        )}
      </div>
    );
  };

  const renderExperienceSection = () => {
    if (!viewingResume.sections?.experience || viewingResume.sections.experience.length === 0) return null;
    const expSectionSpacing = resumeTemplate.layout?.sectionSpacing || 24;
    const expHeaderStyle = resumeTemplate.layout?.headerStyle || 'underline';
    
    return (
      <div key="experience" style={{ marginBottom: `${expSectionSpacing}px` }}>
        <div className="flex justify-between items-center mb-3">
          <h2 
            className="font-bold uppercase tracking-wide" 
            style={{ 
              color: theme.colors.primary, 
              fontFamily: theme.fonts.heading, 
              fontSize: theme.fonts.sizes?.sectionHeader || "18px",
              borderBottom: expHeaderStyle === 'underline' ? `2px solid ${theme.colors.primary}` : 'none',
              paddingBottom: expHeaderStyle === 'underline' ? '4px' : '0'
            }}
          >
            {getSectionName('experience', sectionStyles)}
          </h2>
          {viewingResume.metadata?.generatedAt && (
            <button
              onClick={() => handleRegenerateSection('experience')}
              disabled={regeneratingSection === 'experience'}
              className="print:hidden text-xs px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition disabled:opacity-50"
            >
              {regeneratingSection === 'experience' ? '⟳ Regenerating...' : '⟳ Regenerate'}
            </button>
          )}
        </div>
        <div className="space-y-5">
          {viewingResume.sections.experience.map((job, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-bold" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: theme.fonts.sizes?.jobTitle || "16px" }}>
                  {job.jobTitle}
                </h3>
                <span className="font-semibold" style={{ color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: theme.fonts.sizes?.small || "12px" }}>
                  {formatDate(job.startDate)} - {job.isCurrentPosition ? 'Present' : formatDate(job.endDate)}
                </span>
              </div>
              <p className="italic mb-2" style={{ color: theme.colors.muted, fontFamily: theme.fonts.heading, fontSize: theme.fonts.sizes?.body || "14px" }}>
                {job.company}
              </p>
              {job.bullets && job.bullets.length > 0 && (
                isEditMode ? (
                  <div className="space-y-2">
                    {job.bullets.map((bullet, bulletIdx) => (
                      <RichTextEditor
                        key={bulletIdx}
                        value={editedContent[`experience_${idx}_${bulletIdx}`] || bullet}
                        onChange={(content) => {
                          setEditedContent(prev => ({ ...prev, [`experience_${idx}_${bulletIdx}`]: content }));
                        }}
                        placeholder={`Bullet point ${bulletIdx + 1}...`}
                        style={{
                          fontFamily: theme.fonts.body,
                          fontSize: theme.fonts.sizes?.body || "14px"
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-1 ml-5" style={{ listStyleType: 'disc' }}>
                    {job.bullets.map((bullet, bulletIdx) => (
                      <li 
                        key={bulletIdx} 
                        className="leading-relaxed" 
                        style={{ 
                          color: theme.colors.text, 
                          fontFamily: theme.fonts.body, 
                          fontSize: theme.fonts.sizes?.body || "14px",
                          lineHeight: resumeTemplate.layout?.lineHeight || 1.5,
                          marginBottom: `${(resumeTemplate.layout?.paragraphSpacing || 8) / 2}px`
                        }}
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSkillsSection = () => {
    if (!viewingResume.sections?.skills || viewingResume.sections.skills.length === 0) return null;
    const skillsSectionSpacing = resumeTemplate.layout?.sectionSpacing || 24;
    const skillsHeaderStyle = resumeTemplate.layout?.headerStyle || 'underline';
    const skillsFmt = sectionFormatting['skills'] || {};
    
    return (
      <div key="skills" style={{ marginBottom: `${skillsFmt.spacing ?? skillsSectionSpacing}px` }}>
        <div className="flex justify-between items-center mb-3">
          <h2 
            className="font-bold uppercase tracking-wide" 
            style={{ 
              color: theme.colors.primary, 
              fontFamily: theme.fonts.heading, 
              fontSize: theme.fonts.sizes?.sectionHeader || "18px",
              borderBottom: skillsHeaderStyle === 'underline' ? `2px solid ${theme.colors.primary}` : 'none',
              paddingBottom: skillsHeaderStyle === 'underline' ? '4px' : '0'
            }}
          >
            {getSectionName('skills', sectionStyles)}
          </h2>
          {viewingResume.metadata?.generatedAt && (
            <button
              onClick={() => handleRegenerateSection('skills')}
              disabled={regeneratingSection === 'skills'}
              className="print:hidden text-xs px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition disabled:opacity-50"
            >
              {regeneratingSection === 'skills' ? '⟳ Regenerating...' : '⟳ Regenerate'}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 print:gap-1">
          {viewingResume.sections.skills.map((skill, idx) => {
            const skillName = typeof skill === 'string' ? skill : skill.name || skill;
            return (
              <div 
                key={idx}
                className="group inline-flex items-center gap-1 px-2 py-1 print:px-1 print:py-0.5 rounded print:rounded-sm bg-gray-100 print:bg-transparent"
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fonts.sizes?.body || "14px"
                }}
              >
                <span style={{ color: skillsFmt.color || theme.colors.text }}>
                  {skillName}
                </span>
                <button
                  onClick={() => handleDeleteSkill(skill)}
                  className="print:hidden opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800 ml-1"
                  title="Remove skill"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderEducationSection = () => {
    if (!viewingResume.sections?.education || viewingResume.sections.education.length === 0) return null;
    const eduSectionSpacing = resumeTemplate.layout?.sectionSpacing || 24;
    const eduHeaderStyle = resumeTemplate.layout?.headerStyle || 'underline';
    const educationFmt = sectionFormatting['education'] || {};
    
    return (
      <div key="education" style={{ marginBottom: `${educationFmt.spacing ?? eduSectionSpacing}px` }}>
        <h2 
          className="font-bold mb-3 uppercase tracking-wide" 
          style={{ 
            color: theme.colors.primary, 
            fontFamily: theme.fonts.heading, 
            fontSize: theme.fonts.sizes?.sectionHeader || "18px",
            borderBottom: eduHeaderStyle === 'underline' ? `2px solid ${theme.colors.primary}` : 'none',
            paddingBottom: eduHeaderStyle === 'underline' ? '4px' : '0'
          }}
        >
          {getSectionName('education', sectionStyles)}
        </h2>
        <div className="space-y-3">
          {viewingResume.sections.education.map((edu, idx) => {
            const eduFormat = resumeTemplate.layout?.educationFormat || {
              order: ['degree', 'institution', 'location', 'dates', 'gpa'],
              datesOnRight: true,
              locationAfterInstitution: true,
              gpaSeparateLine: true
            };
            
            // Render fields based on template format
            const renderEducationField = (fieldType) => {
              switch (fieldType) {
                case 'degree':
                  return (
                    <h3 
                      key="degree"
                      className="font-bold" 
                      style={{ 
                        color: theme.colors.text, 
                        fontFamily: theme.fonts.heading, 
                        fontSize: theme.fonts.sizes?.jobTitle || "16px"
                      }}
                    >
                      {edu.degree} in {edu.fieldOfStudy}
                    </h3>
                  );
                case 'institution':
                  return (
                    <div 
                      key="institution"
                      className="italic"
                      style={{ 
                        color: theme.colors.muted, 
                        fontFamily: theme.fonts.heading, 
                        fontSize: theme.fonts.sizes?.body || "14px",
                        lineHeight: resumeTemplate.layout?.lineHeight || 1.5
                      }}
                    >
                      {edu.institution}
                      {eduFormat.locationAfterInstitution && edu.location && (
                        <span>, {edu.location}</span>
                      )}
                    </div>
                  );
                case 'location':
                  if (!eduFormat.locationAfterInstitution && edu.location) {
                    return (
                      <div 
                        key="location"
                        className="italic"
                        style={{ 
                          color: theme.colors.muted, 
                          fontFamily: theme.fonts.heading, 
                          fontSize: theme.fonts.sizes?.body || "14px",
                          lineHeight: resumeTemplate.layout?.lineHeight || 1.5
                        }}
                      >
                        {edu.location}
                      </div>
                    );
                  }
                  return null;
                case 'dates':
                  const datesText = `${formatDate(edu.startDate)} - ${edu.current ? 'Present' : formatDate(edu.endDate)}`;
                  return (
                    <span 
                      key="dates"
                      className="font-semibold" 
                      style={{ 
                        color: theme.colors.muted, 
                        fontFamily: theme.fonts.body, 
                        fontSize: theme.fonts.sizes?.small || "12px"
                      }}
                    >
                      {datesText}
                    </span>
                  );
                case 'gpa':
                  if (edu.gpa && (!edu.gpaPrivate)) {
                    return (
                      <p 
                        key="gpa"
                        className={eduFormat.gpaSeparateLine ? "mt-1" : ""}
                        style={{ 
                          color: theme.colors.text, 
                          fontFamily: theme.fonts.body, 
                          fontSize: theme.fonts.sizes?.small || "12px",
                          lineHeight: resumeTemplate.layout?.lineHeight || 1.5
                        }}
                      >
                        GPA: {edu.gpa}
                      </p>
                    );
                  }
                  return null;
                default:
                  return null;
              }
            };
            
            // Determine if dates should be on same line (right-aligned) with degree/institution
            const datesIndex = eduFormat.order.indexOf('dates');
            const degreeIndex = eduFormat.order.indexOf('degree');
            const institutionIndex = eduFormat.order.indexOf('institution');
            
            // Find first field (degree or institution)
            let firstFieldType = null;
            let firstFieldIndex = Infinity;
            if (degreeIndex !== -1 && degreeIndex < firstFieldIndex) {
              firstFieldIndex = degreeIndex;
              firstFieldType = 'degree';
            }
            if (institutionIndex !== -1 && institutionIndex < firstFieldIndex) {
              firstFieldIndex = institutionIndex;
              firstFieldType = 'institution';
            }
            
            // Dates on right if flag is set AND dates come right after first field
            const hasDatesOnRight = eduFormat.datesOnRight && 
              datesIndex !== -1 && 
              firstFieldIndex !== Infinity &&
              datesIndex === firstFieldIndex + 1;
            
            // Render all fields in order
            const renderedFields = [];
            let datesField = null;
            
            for (let i = 0; i < eduFormat.order.length; i++) {
              const field = eduFormat.order[i];
              
              if (field === 'dates') {
                if (hasDatesOnRight) {
                  datesField = renderEducationField('dates');
                } else {
                  // Dates not on right - render normally
                  const rendered = renderEducationField('dates');
                  if (rendered) {
                    renderedFields.push({ type: 'normal', element: rendered });
                  }
                }
              } else {
                const rendered = renderEducationField(field);
                if (rendered) {
                  if (field === firstFieldType) {
                    // First field - may be on same line as dates
                    renderedFields.unshift({ type: 'first', element: rendered });
                  } else {
                    renderedFields.push({ type: 'normal', element: rendered });
                  }
                }
              }
            }
            
            // Separate first field from rest
            const firstField = renderedFields.find(f => f.type === 'first');
            const otherFields = renderedFields.filter(f => f.type !== 'first');
            
            return (
              <div key={idx}>
                {firstField && (
                  <div className={hasDatesOnRight && datesField ? "flex justify-between items-baseline" : ""}>
                    <div>
                      {firstField.element}
                    </div>
                    {hasDatesOnRight && datesField && (
                      <div>
                        {datesField}
                      </div>
                    )}
                  </div>
                )}
                {otherFields.map((field, fIdx) => (
                  <div key={fIdx}>
                    {field.element}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderProjectsSection = () => {
    if (!viewingResume.sections?.projects || viewingResume.sections.projects.length === 0) return null;
    const projSectionSpacing = resumeTemplate.layout?.sectionSpacing || 24;
    const projHeaderStyle = resumeTemplate.layout?.headerStyle || 'underline';
    const projectsFmt = sectionFormatting['projects'] || {};
    
    return (
      <div key="projects" style={{ marginBottom: `${projectsFmt.spacing ?? projSectionSpacing}px` }}>
        <h2 
          className="font-bold mb-3 uppercase tracking-wide" 
          style={{ 
            color: theme.colors.primary, 
            fontFamily: theme.fonts.heading, 
            fontSize: theme.fonts.sizes?.sectionHeader || "18px",
            borderBottom: projHeaderStyle === 'underline' ? `2px solid ${theme.colors.primary}` : 'none',
            paddingBottom: projHeaderStyle === 'underline' ? '4px' : '0'
          }}
        >
          {getSectionName('projects', sectionStyles)}
        </h2>
        <div className="space-y-3">
          {viewingResume.sections.projects.map((proj, idx) => (
            <div key={idx}>
              <h3 className="font-bold" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: theme.fonts.sizes?.jobTitle || "16px" }}>
                {proj.name}
              </h3>
              <p 
                className="leading-relaxed mb-1" 
                style={{ 
                  color: projectsFmt.color || theme.colors.text, 
                  fontFamily: theme.fonts.body, 
                  fontSize: theme.fonts.sizes?.body || "14px",
                  textAlign: resumeTemplate.layout?.textAlignment || 'left',
                  lineHeight: resumeTemplate.layout?.lineHeight || 1.5
                }}
              >
                {proj.description}
              </p>
              {proj.technologies && proj.technologies.length > 0 && (
                <p 
                  className="italic" 
                  style={{ 
                    color: theme.colors.muted, 
                    fontFamily: theme.fonts.body, 
                    fontSize: theme.fonts.sizes?.small || "12px",
                    lineHeight: resumeTemplate.layout?.lineHeight || 1.5
                  }}
                >
                  Technologies: {proj.technologies.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAwardsSection = () => {
    if (!viewingResume.sections?.awards || viewingResume.sections.awards.length === 0) return null;
    const awardsSectionSpacing = resumeTemplate.layout?.sectionSpacing || 24;
    const awardsHeaderStyle = resumeTemplate.layout?.headerStyle || 'underline';
    const awardsFmt = sectionFormatting['awards'] || {};
    
    return (
      <div key="awards" style={{ marginBottom: `${awardsFmt.spacing ?? awardsSectionSpacing}px` }}>
        <h2 
          className="font-bold mb-3 uppercase tracking-wide" 
          style={{ 
            color: theme.colors.primary, 
            fontFamily: theme.fonts.heading, 
            fontSize: theme.fonts.sizes?.sectionHeader || "18px",
            borderBottom: awardsHeaderStyle === 'underline' ? `2px solid ${theme.colors.primary}` : 'none',
            paddingBottom: awardsHeaderStyle === 'underline' ? '4px' : '0'
          }}
        >
          {getSectionName('awards', sectionStyles)}
        </h2>
        <div className="space-y-2">
          {viewingResume.sections.awards.map((award, idx) => (
            <div 
              key={idx} 
              style={{ 
                color: awardsFmt.color || theme.colors.text, 
                fontFamily: theme.fonts.body, 
                fontSize: theme.fonts.sizes?.body || "14px",
                textAlign: resumeTemplate.layout?.textAlignment || 'left',
                lineHeight: resumeTemplate.layout?.lineHeight || 1.5,
                marginBottom: `${(resumeTemplate.layout?.paragraphSpacing || 8) / 2}px`
              }}
            >
              {typeof award === 'string' ? award : `${award.name || award.title || ''}${award.date ? ` (${award.date})` : ''}${award.issuer ? ` - ${award.issuer}` : ''}`}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCertificationsSection = () => {
    if (!viewingResume.sections?.certifications || viewingResume.sections.certifications.length === 0) return null;
    const certSectionSpacing = resumeTemplate.layout?.sectionSpacing || 24;
    const certHeaderStyle = resumeTemplate.layout?.headerStyle || 'underline';
    const certFmt = sectionFormatting['certifications'] || {};
    
    return (
      <div key="certifications" style={{ marginBottom: `${certFmt.spacing ?? certSectionSpacing}px` }}>
        <h2 
          className="font-bold mb-3 uppercase tracking-wide" 
          style={{ 
            color: theme.colors.primary, 
            fontFamily: theme.fonts.heading, 
            fontSize: theme.fonts.sizes?.sectionHeader || "18px",
            borderBottom: certHeaderStyle === 'underline' ? `2px solid ${theme.colors.primary}` : 'none',
            paddingBottom: certHeaderStyle === 'underline' ? '4px' : '0'
          }}
        >
          {getSectionName('certifications', sectionStyles)}
        </h2>
        <div className="space-y-2">
          {viewingResume.sections.certifications.map((cert, idx) => (
            <div 
              key={idx} 
              style={{ 
                color: certFmt.color || theme.colors.text, 
                fontFamily: theme.fonts.body, 
                fontSize: theme.fonts.sizes?.body || "14px",
                textAlign: resumeTemplate.layout?.textAlignment || 'left',
                lineHeight: resumeTemplate.layout?.lineHeight || 1.5,
                marginBottom: `${(resumeTemplate.layout?.paragraphSpacing || 8) / 2}px`
              }}
            >
              {typeof cert === 'string' ? cert : `${cert.name || cert.title || ''}${cert.date ? ` (${cert.date})` : ''}${cert.issuer ? ` - ${cert.issuer || cert.issuingOrganization}` : ''}`}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return renderSection(sectionType);
};

export default ResumeSectionRenderer;
