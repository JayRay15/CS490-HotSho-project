import { setAuthToken } from "../api/axios";
import api from "../api/axios";

/**
 * Handles file upload and PDF analysis for resume templates
 * Extracted from ResumeTemplates.jsx for better maintainability
 * 
 * @param {File} file - The uploaded file
 * @param {Function} getToken - Function to get auth token (from Clerk)
 * @param {Array} resumes - Existing resumes for fallback theme detection
 * @param {Array} templates - Existing templates for fallback theme detection
 * @returns {Object} Template configuration object
 */
export async function handleResumeFileUpload(file, getToken, resumes = [], templates = []) {
  try {
    // Simple template creation with filename
    const templateName = file.name.replace(/\.[^/.]+$/, "") + " Template";

    // Default theme with professional styling
    let theme = {
      colors: { primary: "#4F5348", text: "#222", muted: "#666" },
      fonts: {
        body: "Inter, sans-serif",
        heading: "Inter, sans-serif",
        sizes: {
          name: "36px",
          sectionHeader: "18px",
          jobTitle: "16px",
          body: "14px",
          small: "12px"
        }
      },
      spacing: 8
    };

    let type = "chronological"; // Default type
    let extractedStructure = null; // Store extracted PDF structure
    let extractedLayout = null; // Store extracted PDF layout
    // Initialize PDF data variables (will be populated if PDF analysis succeeds)
    let pdfBuffer = null;
    let detailedLayout = null;
    let sectionMapping = null;
    let analysisResult = { used: false };

    // Try to analyze PDF if it's a PDF file
    if (file.type === 'application/pdf') {
      try {
        const formData = new FormData();
        formData.append('file', file);

        // Acquire a Clerk JWT without specifying a template;
        // if token is unavailable, skip PDF analysis gracefully.
        let token = null;
        try {
          token = await getToken();
        } catch (e) {
          token = null;
        }
        if (!token) {
          throw new Error('No auth token available for PDF analysis');
        }
        // Ensure axios carries the Authorization header
        setAuthToken(token);
        // Use axios client with configured baseURL
        const { data: analysis } = await api.post('/api/pdf-analysis/analyze', formData);
        console.info('PDF analysis received', analysis?.suggestions);

        // Store PDF buffer and detailed layout for pixel-perfect generation
        pdfBuffer = analysis?.pdfBuffer || null;
        detailedLayout = analysis?.detailedLayout || null;
        sectionMapping = analysis?.sectionMapping || null;

        // Use suggestions from PDF analysis if available
        if (analysis?.suggestions) {
          theme = {
            colors: analysis.suggestions.colors || theme.colors,
            fonts: analysis.suggestions.fonts || theme.fonts,
            spacing: theme.spacing
          };
          type = analysis.suggestions.type || type;
          // Mark that PDF analysis suggestions were applied
          analysisResult = { used: true, suggestions: analysis.suggestions };

          // Use extracted structure if available
          if (analysis.suggestions.structure?.sectionsOrder?.length > 0) {
            extractedStructure = analysis.suggestions.structure;
          }

          // Store layout information (alignment, spacing, etc.)
          if (analysis.suggestions.layout) {
            extractedLayout = analysis.suggestions.layout;
          }
        }
      } catch (pdfError) {
        console.log('PDF analysis unavailable, using defaults:', pdfError);
        // Continue with default theme - not a critical error
      }
    }

    // If no PDF analysis, use existing resumes/templates as fallback
    if (resumes.length > 0 && resumes[0].templateId) {
      const firstResumeTemplate = templates.find(t => t._id === resumes[0].templateId);
      if (firstResumeTemplate && firstResumeTemplate.theme) {
        // Only override if PDF analysis didn't provide better data
        if (file.type !== 'application/pdf') {
          theme = firstResumeTemplate.theme;
        }
      }
    } else if (templates.length > 0 && templates[0].theme && file.type !== 'application/pdf') {
      theme = templates[0].theme;
    }

    // Smart template type detection from filename (overrides PDF analysis if explicit)
    type = detectTemplateType(templateName, file.name, type, templates, file.type);

    // Set sections order - prioritize extracted structure from PDF, otherwise use type-based defaults
    const sectionsOrder = getSectionsOrder(extractedStructure, type);

    // Store section names mapping if extracted from PDF
    const sectionStyles = {};
    if (extractedStructure?.sectionNames) {
      // Preserve the actual section names from the PDF
      Object.entries(extractedStructure.sectionNames).forEach(([standardName, actualName]) => {
        sectionStyles[standardName] = { displayName: actualName };
      });
    }

    // Add layout properties to sectionStyles or layout
    if (extractedLayout) {
      // Store layout properties at the template level
      if (!theme.spacing) {
        theme.spacing = extractedLayout.sectionSpacing || 8;
      }
    }

    // Store education format if extracted from PDF (already included in extractedLayout)
    const educationFormat = extractedLayout?.educationFormat || null;

    // Store project and experience formats if extracted from PDF
    const projectFormat = extractedLayout?.projectFormat || null;
    const experienceFormat = extractedLayout?.experienceFormat || null;

    console.log('Storing layout formats:', { educationFormat, projectFormat, experienceFormat });

    return {
      name: templateName,
      type: type,
      layout: {
        sectionsOrder: sectionsOrder,
        sectionStyles: sectionStyles,
        // Store layout properties
        headerAlignment: extractedLayout?.headerAlignment || 'center',
        textAlignment: extractedLayout?.textAlignment || 'left',
        sectionSpacing: extractedLayout?.sectionSpacing || 24,
        headerStyle: extractedLayout?.headerStyle || 'underline',
        lineHeight: extractedLayout?.lineHeight || 1.5,
        paragraphSpacing: extractedLayout?.paragraphSpacing || 8,
        // Store section-specific formats if extracted
        educationFormat: educationFormat,
        projectFormat: projectFormat,
        experienceFormat: experienceFormat
      },
      theme: theme,
      analysis: analysisResult,
      // Include PDF data for pixel-perfect generation
      pdfBuffer: pdfBuffer || null,
      pdfLayout: detailedLayout || null,
      sectionMapping: sectionMapping || null
    };
  } catch (error) {
    console.error("Error processing file:", error);
    throw new Error("Failed to process resume file");
  }
}

/**
 * Detects template type from filename or existing templates
 */
function detectTemplateType(templateName, fileName, defaultType, templates, fileType) {
  const lowerName = templateName.toLowerCase();
  const lowerFileName = fileName.toLowerCase();

  if (lowerName.includes("functional") || lowerFileName.includes("functional") ||
    lowerName.includes("skills-based") || lowerFileName.includes("skills")) {
    return "functional";
  } else if (lowerName.includes("hybrid") || lowerFileName.includes("hybrid") ||
    lowerName.includes("combination") || lowerFileName.includes("combination") ||
    lowerName.includes("combined")) {
    return "hybrid";
  } else if (lowerName.includes("chronological") || lowerFileName.includes("chronological") ||
    lowerName.includes("reverse") || lowerFileName.includes("timeline")) {
    return "chronological";
  }
  // If no explicit type in filename and no PDF analysis, check user's existing templates
  else if (templates.length > 0 && fileType !== 'application/pdf') {
    const typeCounts = templates.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {});
    const mostCommonType = Object.keys(typeCounts).reduce((a, b) =>
      typeCounts[a] > typeCounts[b] ? a : b, 'chronological'
    );
    return mostCommonType;
  }

  return defaultType;
}

/**
 * Gets sections order based on extracted structure or template type
 */
function getSectionsOrder(extractedStructure, type) {
  if (extractedStructure?.sectionsOrder?.length > 0) {
    // Use the exact structure extracted from the PDF
    console.log('Using extracted PDF structure:', extractedStructure.sectionsOrder);
    return extractedStructure.sectionsOrder;
  }

  // Fallback to type-based ordering
  switch (type) {
    case 'functional':
      // Functional: Skills come before experience to highlight capabilities first
      return ["summary", "skills", "experience", "education", "projects"];
    case 'hybrid':
      // Hybrid: Skills and experience can be close together, often skills first
      return ["summary", "skills", "experience", "education", "projects"];
    case 'chronological':
    default:
      // Chronological: Experience comes before skills (traditional format)
      return ["summary", "experience", "skills", "education", "projects"];
  }
}
