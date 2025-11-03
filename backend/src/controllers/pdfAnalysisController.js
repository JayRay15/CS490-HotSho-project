/**
 * Analyze a PDF resume to extract styling hints
 * This provides basic analysis - color/font extraction from PDFs is limited
 */
export const analyzePDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    // Use pdfjs-dist for both text extraction and color detection
    let analysis;
    try {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      // Convert Buffer to Uint8Array for pdfjs-dist
      const uint8Array = new Uint8Array(req.file.buffer);
      const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
      const pdfDoc = await loadingTask.promise;

      // Extract text from the first up to 3 pages with layout information
      const maxPages = Math.min(3, pdfDoc.numPages || 1);
      let textParts = [];
      let layoutInfo = {
        headerAlignment: 'center',
        sectionSpacing: 24,
        textAlignment: 'left',
        hasBorder: false,
        headerStyle: 'underline'
      };
      
      for (let p = 1; p <= maxPages; p++) {
        const page = await pdfDoc.getPage(p);
        const tc = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });
        const pageText = tc.items?.map((it) => it.str).join('\n') || '';
        textParts.push(pageText);
        
        // Analyze layout from first page only
        if (p === 1 && tc.items && tc.items.length > 0) {
          layoutInfo = extractLayoutInfo(tc.items, viewport);
        }
      }
      const fullText = textParts.join('\n');

      analysis = {
        text: fullText,
        pageCount: pdfDoc.numPages || maxPages,
        metadata: {},
        suggestions: analyzeContent(fullText, layoutInfo)
      };

      // Color detection from first page
      try {
        const firstPage = await pdfDoc.getPage(1);
        const opList = await firstPage.getOperatorList();
        const colors = detectColorsFromOps(pdfjsLib, opList.fnArray, opList.argsArray);
        if (colors.primary) {
          analysis.suggestions.colors.primary = colors.primary;
          console.log('✓ Detected primary color from PDF:', colors.primary);
        }
        if (colors.text) {
          analysis.suggestions.colors.text = colors.text;
          console.log('✓ Detected text color from PDF:', colors.text);
        }
        if (colors.muted) {
          analysis.suggestions.colors.muted = colors.muted;
          console.log('✓ Detected muted color from PDF:', colors.muted);
        }
      } catch (colorErr) {
        console.log('PDF color detection skipped:', colorErr?.message || colorErr);
      }
      
      // Log layout information
      if (analysis.suggestions.layout) {
        console.log('✓ Extracted layout from PDF:', {
          headerAlignment: analysis.suggestions.layout.headerAlignment,
          sectionSpacing: analysis.suggestions.layout.sectionSpacing,
          textAlignment: analysis.suggestions.layout.textAlignment
        });
      }
    } catch (e) {
      // Fallback: no pdfjs available
      console.log('pdfjs text/color extraction failed:', e?.message || e);
      analysis = {
        text: '',
        pageCount: 1,
        metadata: {},
        suggestions: analyzeContent('')
      };
    }

    console.log('PDF analysis suggestions:', analysis.suggestions);
    res.json(analysis);
  } catch (error) {
    console.error('PDF analysis error:', error);
    res.status(500).json({ 
      message: 'Failed to analyze PDF', 
      error: error.message 
    });
  }
};

/**
 * Extract layout information from PDF text items
 */
function extractLayoutInfo(textItems, viewport) {
  if (!textItems || textItems.length === 0) {
    return {
      headerAlignment: 'center',
      sectionSpacing: 24,
      textAlignment: 'left',
      hasBorder: false,
      headerStyle: 'underline'
    };
  }

  const pageWidth = viewport.width;
  const layout = {
    headerAlignment: 'center',
    sectionSpacing: 24,
    textAlignment: 'left',
    hasBorder: false,
    headerStyle: 'underline',
    lineHeight: 1.5,
    paragraphSpacing: 8
  };

  // Analyze first few lines for header alignment
  const firstLines = [];
  let currentY = null;
  let currentLine = { x: [], text: '' };
  
  textItems.slice(0, Math.min(50, textItems.length)).forEach((item, idx) => {
    if (item.transform) {
      const x = item.transform[4];
      const y = item.transform[5];
      
      if (currentY === null || Math.abs(y - currentY) < 5) {
        // Same line
        if (currentY === null) currentY = y;
        currentLine.x.push(x);
        currentLine.text += item.str;
      } else {
        // New line
        if (currentLine.text.trim().length > 0 && currentLine.x.length > 0) {
          firstLines.push({
            ...currentLine,
            avgX: currentLine.x.reduce((a, b) => a + b, 0) / currentLine.x.length,
            y: currentY
          });
        }
        currentY = y;
        currentLine = { x: [x], text: item.str };
      }
    }
  });
  
  if (currentLine.text.trim().length > 0) {
    firstLines.push({
      ...currentLine,
      avgX: currentLine.x.reduce((a, b) => a + b, 0) / currentLine.x.length,
      y: currentY
    });
  }

  // Determine header alignment (first line, likely the name)
  if (firstLines.length > 0) {
    const firstLineX = firstLines[0].avgX;
    const centerX = pageWidth / 2;
    const leftMargin = pageWidth * 0.1; // Assume 10% margin
    
    if (Math.abs(firstLineX - centerX) < 50) {
      layout.headerAlignment = 'center';
    } else if (firstLineX < centerX - 100) {
      layout.headerAlignment = 'left';
    } else {
      layout.headerAlignment = 'right';
    }
  }

  // Analyze section spacing (distance between lines)
  if (firstLines.length > 3) {
    const spacings = [];
    for (let i = 1; i < firstLines.length; i++) {
      const spacing = Math.abs(firstLines[i].y - firstLines[i-1].y);
      if (spacing > 10 && spacing < 100) {
        spacings.push(spacing);
      }
    }
    if (spacings.length > 0) {
      const avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length;
      layout.sectionSpacing = Math.round(avgSpacing / 2); // Convert to approximate px
    }
  }

  // Determine text alignment from body text
  if (firstLines.length > 3) {
    const bodyLines = firstLines.slice(3, Math.min(10, firstLines.length));
    const avgX = bodyLines.reduce((sum, line) => sum + line.avgX, 0) / bodyLines.length;
    const centerX = pageWidth / 2;
    
    if (Math.abs(avgX - centerX) < 100) {
      layout.textAlignment = 'justify';
    } else if (avgX < centerX) {
      layout.textAlignment = 'left';
    } else {
      layout.textAlignment = 'right';
    }
  }

  return layout;
}

/**
 * Analyze PDF text content to provide styling suggestions and extract structure
 */
function analyzeContent(text, layoutInfo = null) {
  const suggestions = {
    colors: {
      primary: "#4F5348",  // Default sage green
      text: "#222",
      muted: "#666"
    },
    fonts: {
      heading: "Inter, sans-serif",
      body: "Inter, sans-serif",
      sizes: {
        name: "36px",
        sectionHeader: "18px",
        jobTitle: "16px",
        body: "14px",
        small: "12px"
      }
    },
    type: "chronological",
    structure: {
      sectionsOrder: [],
      sectionNames: {}
    },
    layout: layoutInfo || {
      headerAlignment: 'center',
      sectionSpacing: 24,
      textAlignment: 'left',
      hasBorder: false,
      headerStyle: 'underline',
      lineHeight: 1.5,
      paragraphSpacing: 8
    }
  };

  const lowerText = text.toLowerCase();
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Extract actual section structure from PDF
  const detectedSections = extractSectionStructure(lines, text);
  if (detectedSections.sectionsOrder.length > 0) {
    suggestions.structure = detectedSections;
    console.log('✓ Extracted section structure from PDF:', detectedSections.sectionsOrder);
    console.log('✓ Section names mapping:', detectedSections.sectionNames);
  }

  // Extract education entry format from PDF
  const educationFormat = extractEducationFormat(lines, text);
  if (educationFormat) {
    suggestions.layout.educationFormat = educationFormat;
    console.log('✓ Extracted education format from PDF:', educationFormat);
  }

  // Detect resume type based on content structure
  const experienceIndex = lowerText.indexOf('experience');
  const skillsIndex = lowerText.indexOf('skills');
  const summaryIndex = lowerText.indexOf('summary');

  if (skillsIndex > -1 && skillsIndex < experienceIndex) {
    suggestions.type = 'functional'; // Skills come before experience
  } else if (experienceIndex > -1 && skillsIndex > -1 && 
             Math.abs(experienceIndex - skillsIndex) < 500) {
    suggestions.type = 'hybrid'; // Skills and experience are close together
  }

  // If we detected sections, use that order for type detection too
  if (detectedSections.sectionsOrder.length > 0) {
    const detectedOrder = detectedSections.sectionsOrder.map(s => s.toLowerCase());
    const skillsPos = detectedOrder.indexOf('skills');
    const expPos = detectedOrder.indexOf('experience');
    if (skillsPos > -1 && expPos > -1) {
      if (skillsPos < expPos) {
        suggestions.type = 'functional';
      } else if (Math.abs(skillsPos - expPos) <= 1) {
        suggestions.type = 'hybrid';
      } else {
        suggestions.type = 'chronological';
      }
    }
  }

  // Analyze font sizes based on line lengths and patterns
  const lineLengths = lines.map(line => line.trim().length);
  
  // Find potential name (usually short, at the top)
  if (lines.length > 0 && lineLengths[0] < 50) {
    // Likely a name at the top
    const nameLength = lineLengths[0];
    if (nameLength < 20) {
      suggestions.fonts.sizes.name = "42px"; // Larger for short names
    } else if (nameLength < 30) {
      suggestions.fonts.sizes.name = "36px";
    } else {
      suggestions.fonts.sizes.name = "30px";
    }
  }

  // Detect section headers (usually all caps or have certain keywords)
  const sectionHeaders = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && 
           trimmed.length < 50 &&
           (trimmed === trimmed.toUpperCase() || 
            ['EXPERIENCE', 'EDUCATION', 'SKILLS', 'SUMMARY', 'PROJECTS', 'PROFESSIONAL EXPERIENCE', 
             'WORK EXPERIENCE', 'EDUCATION', 'TECHNICAL SKILLS', 'PROFESSIONAL SUMMARY', 
             'OBJECTIVE', 'AWARDS', 'CERTIFICATIONS', 'PUBLICATIONS'].some(
              keyword => trimmed.toUpperCase().includes(keyword)
            ));
  });

  if (sectionHeaders.length > 0) {
    const avgHeaderLength = sectionHeaders.reduce((sum, h) => sum + h.length, 0) / sectionHeaders.length;
    if (avgHeaderLength < 15) {
      suggestions.fonts.sizes.sectionHeader = "20px"; // Larger for short headers
    }
  }

  // Font family suggestions based on common patterns
  // (This is speculative - PDFs don't easily expose font info)
  if (text.match(/\u2022/g)) {
    // Has bullet points, might be using a modern sans-serif
    suggestions.fonts.body = "Inter, sans-serif";
    suggestions.fonts.heading = "Inter, sans-serif";
  }

  return suggestions;
}

/**
 * Extract section structure from PDF text - finds actual section names and order
 */
function extractSectionStructure(lines, fullText) {
  // Section keyword mappings - map various section name formats to our standard names
  const sectionKeywords = {
    'summary': ['summary', 'professional summary', 'profile', 'objective', 'executive summary'],
    'experience': ['experience', 'work experience', 'professional experience', 'employment', 'employment history', 'work history'],
    'skills': ['skills', 'technical skills', 'core competencies', 'competencies', 'key skills', 'proficiencies'],
    'education': ['education', 'academic background', 'academic history', 'educational background'],
    'projects': ['projects', 'personal projects', 'project experience', 'selected projects'],
    'awards': ['awards', 'honors', 'achievements', 'recognition'],
    'certifications': ['certifications', 'certificates', 'licenses', 'professional certifications']
  };

  // Find section headers in the text
  const foundSections = [];
  const sectionNames = {}; // Map standard name to actual name in PDF
  
  // Track positions to determine order
  const sectionPositions = new Map();
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const upperTrimmed = trimmed.toUpperCase();
    
    // Check if this line looks like a section header
    // Section headers are usually: short, all caps or title case, standalone lines
    const isLikelyHeader = trimmed.length > 0 && 
                          trimmed.length < 50 &&
                          (trimmed === trimmed.toUpperCase() || 
                           /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(trimmed)) &&
                          index < lines.length - 1; // Not the last line
    
    if (isLikelyHeader) {
      // Check against our known section keywords
      for (const [standardName, keywords] of Object.entries(sectionKeywords)) {
        for (const keyword of keywords) {
          if (upperTrimmed.includes(keyword.toUpperCase()) || 
              upperTrimmed === keyword.toUpperCase() ||
              trimmed.toLowerCase() === keyword.toLowerCase()) {
            
            // Found a section
            if (!sectionPositions.has(standardName)) {
              foundSections.push({
                standardName,
                actualName: trimmed,
                position: index,
                keyword
              });
              sectionPositions.set(standardName, index);
              sectionNames[standardName] = trimmed;
            }
            break;
          }
        }
      }
    }
  });

  // Sort sections by their position in the document
  foundSections.sort((a, b) => a.position - b.position);
  
  // Build sections order array
  let sectionsOrder = foundSections.map(s => s.standardName);
  
  // If no sections found, try fallback detection
  if (sectionsOrder.length === 0) {
    const lowerText = fullText.toLowerCase();
    const fallbackOrder = [];
    
    // Try finding sections by searching full text
    for (const [standardName, keywords] of Object.entries(sectionKeywords)) {
      for (const keyword of keywords) {
        const index = lowerText.indexOf(keyword);
        if (index !== -1) {
          if (!fallbackOrder.find(s => s.name === standardName)) {
            fallbackOrder.push({ name: standardName, index });
          }
          break;
        }
      }
    }
    
    fallbackOrder.sort((a, b) => a.index - b.index);
    sectionsOrder = fallbackOrder.map(s => s.name);
  }

  // If still nothing, use default order but preserve it
  if (sectionsOrder.length === 0) {
    sectionsOrder = ['summary', 'experience', 'skills', 'education', 'projects'];
  }

  return {
    sectionsOrder,
    sectionNames
  };
}

/**
 * Extract education entry format from PDF text
 * Determines the order and layout of education fields (degree, institution, location, dates, GPA)
 */
function extractEducationFormat(lines, fullText) {
  const lowerText = fullText.toLowerCase();
  const educationIndex = lowerText.indexOf('education');
  
  if (educationIndex === -1) {
    // Try alternative keywords
    if (lowerText.indexOf('academic') === -1 && lowerText.indexOf('degree') === -1) {
      return null;
    }
  }

  // Find education section in lines
  let educationStartIdx = -1;
  let educationEndIdx = lines.length;
  
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim().toLowerCase();
    if ((trimmed === 'education' || trimmed.includes('education')) && educationStartIdx === -1) {
      educationStartIdx = i + 1; // Start after header
      break;
    }
  }
  
  // Find end of education section (next section header or end of document)
  const sectionHeaders = ['experience', 'skills', 'projects', 'awards', 'certifications', 'summary'];
  for (let i = educationStartIdx; i < lines.length; i++) {
    const trimmed = lines[i].trim().toLowerCase();
    if (sectionHeaders.some(header => trimmed === header || trimmed.includes(header))) {
      educationEndIdx = i;
      break;
    }
  }

  if (educationStartIdx === -1 || educationStartIdx >= educationEndIdx) {
    return null;
  }

  // Analyze education entries in the section
  const educationLines = lines.slice(educationStartIdx, educationEndIdx);
  
  // Look for patterns in education entries
  // Common patterns:
  // 1. Degree/Field on one line, Institution on next, dates on right or next line
  // 2. Institution first, then degree, then dates
  // 3. Degree and dates on same line, institution below
  
  let degreeFirst = false;
  let institutionFirst = false;
  let datesOnRight = false;
  let locationAfterInstitution = false;
  let gpaSeparateLine = false;
  
  // Check first few non-empty lines after education header
  const entryLines = educationLines.filter(l => l.trim().length > 0).slice(0, 10);
  
  for (let i = 0; i < entryLines.length; i++) {
    const line = entryLines[i].trim();
    
    // Check for degree patterns (Bachelor's, Master's, Ph.D, etc.)
    if (/bachelor|master|ph\.?d|doctorate|associate/i.test(line)) {
      if (i === 0 || (i < 2 && !institutionFirst)) {
        degreeFirst = true;
      }
    }
    
    // Check for institution patterns (University, College, Institute, School)
    if (/university|college|institute|school/i.test(line) && !/bachelor|master|ph\.?d/i.test(line)) {
      if (i === 0) {
        institutionFirst = true;
      }
      // Check if next line has location (City, State pattern)
      if (i + 1 < entryLines.length) {
        const nextLine = entryLines[i + 1].trim();
        if (/^[A-Z][a-z]+,\s*[A-Z]{2}$|^[A-Z][a-z]+,\s*[A-Z][a-z]+$/.test(nextLine)) {
          locationAfterInstitution = true;
        }
      }
    }
    
    // Check for dates on the right (line ends with year or date pattern)
    if (/^\d{4}$|^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s,]\d{4}$|^\d{1,2}\/\d{4}$/.test(line)) {
      // Check if this is aligned to the right or on same line as degree/institution
      datesOnRight = true;
    }
    
    // Check for GPA pattern
    if (/gpa|grade point average/i.test(line)) {
      gpaSeparateLine = true;
    }
  }

  // Determine field order based on detected patterns
  const order = [];
  if (degreeFirst) {
    order.push('degree', 'institution');
  } else if (institutionFirst) {
    order.push('institution', 'degree');
  } else {
    // Default: degree first
    order.push('degree', 'institution');
  }
  
  if (locationAfterInstitution) {
    order.push('location');
  }
  
  order.push('dates');
  
  if (gpaSeparateLine) {
    order.push('gpa');
  }

  return {
    order: order.length > 0 ? order : ['degree', 'institution', 'location', 'dates', 'gpa'],
    datesOnRight: datesOnRight,
    locationAfterInstitution: locationAfterInstitution,
    gpaSeparateLine: gpaSeparateLine
  };
}

// Heuristic: detect colors from operator list (primary, text, muted)
function detectColorsFromOps(pdfjsLib, fnArray, argsArray) {
  const { OPS } = pdfjsLib;
  
  const toHex = (r, g, b) => {
    const c = (v) => {
      const n = Math.max(0, Math.min(255, Math.round(v * 255)));
      return n.toString(16).padStart(2, '0');
    };
    return `#${c(r)}${c(g)}${c(b)}`;
  };

  const normalizeRGB = (r, g, b) => {
    // Handle different RGB value ranges (0-1, 0-255, 0-100, etc.)
    if (r > 1 || g > 1 || b > 1) {
      // Values are in 0-255 range or similar, normalize to 0-1
      return {
        r: Math.max(0, Math.min(1, r / 255)),
        g: Math.max(0, Math.min(1, g / 255)),
        b: Math.max(0, Math.min(1, b / 255))
      };
    }
    return { r: Math.max(0, Math.min(1, r)), g: Math.max(0, Math.min(1, g)), b: Math.max(0, Math.min(1, b)) };
  };

  const isPrimaryColor = ({ r, g, b }) => {
    // Primary colors: medium saturation, not black/white/gray
    const maxVal = Math.max(r, g, b);
    const minVal = Math.min(r, g, b);
    const brightness = (r + g + b) / 3;
    const saturation = maxVal > 0 ? (maxVal - minVal) / maxVal : 0;
    
    const isBlack = brightness < 0.15;
    const isWhite = brightness > 0.85;
    const isGray = saturation < 0.1;
    
    // Primary should have some color (saturation > 0.15) and be visible
    return !isBlack && !isWhite && !isGray && saturation > 0.15 && brightness > 0.2 && brightness < 0.8;
  };

  const isTextColor = ({ r, g, b }) => {
    // Text colors: dark, low saturation (near black/dark gray)
    const brightness = (r + g + b) / 3;
    const maxVal = Math.max(r, g, b);
    const minVal = Math.min(r, g, b);
    const saturation = maxVal > 0 ? (maxVal - minVal) / maxVal : 0;
    
    return brightness < 0.4 && saturation < 0.2; // Dark colors, low saturation
  };

  const isMutedColor = ({ r, g, b }) => {
    // Muted colors: medium brightness, low saturation (grays, soft colors)
    const brightness = (r + g + b) / 3;
    const maxVal = Math.max(r, g, b);
    const minVal = Math.min(r, g, b);
    const saturation = maxVal > 0 ? (maxVal - minVal) / maxVal : 0;
    
    return brightness > 0.3 && brightness < 0.7 && saturation < 0.3;
  };

  // Score colors for primary selection
  const scorePrimaryColor = ({ r, g, b }) => {
    const maxVal = Math.max(r, g, b);
    const minVal = Math.min(r, g, b);
    const saturation = maxVal > 0 ? (maxVal - minVal) / maxVal : 0;
    const brightness = (r + g + b) / 3;
    
    // Prefer moderate saturation (0.2-0.6) and mid brightness (0.3-0.7)
    const satScore = saturation > 0.2 && saturation < 0.6 ? 2 : (saturation > 0.15 ? 1 : 0.5);
    const brightScore = brightness > 0.3 && brightness < 0.7 ? 2 : (brightness > 0.2 && brightness < 0.8 ? 1 : 0.5);
    
    return satScore * brightScore;
  };

  // Collect all colors with their frequency and type
  const primaryColors = new Map();
  const textColors = new Map();
  const mutedColors = new Map();
  const allColors = new Map(); // For debugging

  for (let i = 0; i < fnArray.length; i++) {
    const fn = fnArray[i];
    const args = argsArray[i] || [];
    let rgb = null;

    try {
      // Handle different color operators
      switch (fn) {
        case OPS.setFillRGBColor:
        case OPS.setStrokeRGBColor: {
          if (args.length >= 3) {
            rgb = normalizeRGB(args[0], args[1], args[2]);
          }
          break;
        }
        case OPS.setFillColorN:
        case OPS.setStrokeColorN: {
          // ColorN can have different formats, try RGB first
          if (args.length >= 3) {
            // Check if values look like normalized RGB (0-1) or unnormalized (0-255)
            rgb = normalizeRGB(args[0], args[1], args[2]);
          }
          break;
        }
        case OPS.setFillColor:
        case OPS.setStrokeColor: {
          // Single value - could be grayscale or indexed color
          if (args.length >= 1 && args.length <= 3) {
            if (args.length === 1) {
              // Grayscale - convert to RGB
              const gray = Math.max(0, Math.min(1, args[0] > 1 ? args[0] / 255 : args[0]));
              rgb = { r: gray, g: gray, b: gray };
            } else if (args.length >= 3) {
              rgb = normalizeRGB(args[0], args[1], args[2]);
            }
          }
          break;
        }
        default:
          break;
      }

      if (rgb) {
        const hex = toHex(rgb.r, rgb.g, rgb.b);
        allColors.set(hex, (allColors.get(hex) || 0) + 1);

        // Categorize colors
        if (isPrimaryColor(rgb)) {
          const existing = primaryColors.get(hex) || { count: 0, rgb, score: 0 };
          existing.count++;
          existing.score = scorePrimaryColor(rgb);
          primaryColors.set(hex, existing);
        } else if (isTextColor(rgb)) {
          const count = textColors.get(hex) || 0;
          textColors.set(hex, count + 1);
        } else if (isMutedColor(rgb)) {
          const count = mutedColors.get(hex) || 0;
          mutedColors.set(hex, count + 1);
        }
      }
    } catch (err) {
      // Continue on error
      // console.log('Color extraction error:', err.message);
    }
  }

  // Log all found colors for debugging
  if (allColors.size > 0) {
    console.log('All colors found in PDF:', Array.from(allColors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([hex, count]) => `${hex}(${count})`)
      .join(', '));
  }

  // Select best primary color
  let primary = null;
  if (primaryColors.size > 0) {
    const scored = Array.from(primaryColors.entries())
      .map(([hex, data]) => ({
        hex,
        totalScore: data.count * data.score
      }))
      .sort((a, b) => b.totalScore - a.totalScore);
    
    primary = scored[0].hex;
    console.log('Primary color candidates:', scored.slice(0, 3).map(c => `${c.hex}(score:${c.totalScore.toFixed(1)})`).join(', '));
  }

  // Select most common text color
  let text = null;
  if (textColors.size > 0) {
    const sorted = Array.from(textColors.entries())
      .sort((a, b) => b[1] - a[1]);
    text = sorted[0][0];
    console.log('Text color candidates:', sorted.slice(0, 3).map(([hex, count]) => `${hex}(${count})`).join(', '));
  }

  // Select most common muted color
  let muted = null;
  if (mutedColors.size > 0) {
    const sorted = Array.from(mutedColors.entries())
      .sort((a, b) => b[1] - a[1]);
    muted = sorted[0][0];
    console.log('Muted color candidates:', sorted.slice(0, 3).map(([hex, count]) => `${hex}(${count})`).join(', '));
  }

  return { primary, text, muted };
}
