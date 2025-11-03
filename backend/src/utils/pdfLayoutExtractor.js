/**
 * PDF Layout Extractor
 * Extracts precise layout information from PDF templates including:
 * - Text positions, fonts, sizes, colors
 * - Graphics and shapes (lines, rectangles, etc.)
 * - Page structure and dimensions
 * - Text bounding boxes for mapping to resume sections
 */

import { PDFDocument } from 'pdf-lib';

/**
 * Extract detailed layout information from a PDF template
 * @param {Buffer|Uint8Array} pdfBuffer - The PDF file buffer
 * @returns {Promise<Object>} Layout metadata including text regions and graphics
 */
export async function extractPdfLayout(pdfBuffer) {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const uint8Array = pdfBuffer instanceof Buffer ? new Uint8Array(pdfBuffer) : pdfBuffer;
    
    // Load PDF with pdf-lib for structure
    const pdfDoc = await PDFDocument.load(uint8Array);
    const pages = pdfDoc.getPages();
    
    // Load with pdfjs-dist for detailed text content analysis
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdfjsDoc = await loadingTask.promise;
    
    const layout = {
      pageCount: pdfDoc.getPageCount(),
      pages: [],
      fonts: new Map(),
      graphics: []
    };

    // Extract layout from each page
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const pdfjsPage = await pdfjsDoc.getPage(pageIndex + 1);
      const viewport = pdfjsPage.getViewport({ scale: 1.0 });
      const textContent = await pdfjsPage.getTextContent();
      const operatorList = await pdfjsPage.getOperatorList();
      
      const pageLayout = {
        pageNumber: pageIndex + 1,
        width: viewport.width,
        height: viewport.height,
        textRegions: [],
        graphics: []
      };

      // Extract text regions with precise positioning
      if (textContent.items && textContent.items.length > 0) {
        const textRegions = extractTextRegions(textContent.items, viewport);
        pageLayout.textRegions = textRegions;
        
        // Extract fonts used - try to get actual font family names
        textContent.items.forEach(item => {
          if (item.fontName) {
            const fontName = item.fontName;
            if (!layout.fonts.has(fontName)) {
              const fontSize = item.height || 12;
              
              // Try to get actual font family name from fontObj if available
              let actualFontName = fontName;
              let baseFontName = null;
              
              if (item.fontObj) {
                try {
                  // Try to access font descriptor properties
                  const fontObj = item.fontObj;
                  
                  // Check if fontObj has loadedName, name, or baseFont properties
                  if (fontObj.loadedName) {
                    actualFontName = fontObj.loadedName;
                  } else if (fontObj.name) {
                    actualFontName = fontObj.name;
                  } else if (fontObj.baseFont) {
                    baseFontName = fontObj.baseFont;
                    actualFontName = baseFontName;
                  }
                  
                  // Try to access the font dictionary directly
                  if (fontObj.dict) {
                    const dict = fontObj.dict;
                    if (dict.get && typeof dict.get === 'function') {
                      try {
                        const baseFont = dict.get('BaseFont');
                        if (baseFont && baseFont.name) {
                          baseFontName = baseFont.name;
                          actualFontName = baseFont.name;
                        }
                      } catch (e) {
                        // Font dict access might fail, continue with fontName
                      }
                    }
                  }
                } catch (e) {
                  // Font object access might not be available, use fontName as fallback
                  console.log(`  ⚠️ Could not extract font descriptor for ${fontName}:`, e.message);
                }
              }
              
              // Clean up font name - remove subset prefixes (e.g., "ABCDEF+TimesNewRoman" -> "TimesNewRoman")
              if (actualFontName && actualFontName.includes('+')) {
                const parts = actualFontName.split('+');
                if (parts.length > 1) {
                  actualFontName = parts[parts.length - 1];
                }
              }
              
              // Remove common PDF font suffixes
              actualFontName = actualFontName
                .replace(/^(A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z)+/, '') // Remove subset prefix
                .replace(/^[A-Z]{6,}\+/, '') // Remove 6+ char subset prefix
                .replace(/^[a-z]_d\d+_f\d+_/, '') // Remove generic prefix like "g_d1_f2_"
                .trim();
              
              // Detect if font is bold/italic from font name or size
              const lowerName = actualFontName.toLowerCase();
              const isBold = lowerName.includes('bold') || 
                            lowerName.includes('bd') ||
                            lowerName.includes('black') ||
                            lowerName.includes('heavy') ||
                            fontSize > 18; // Larger fonts are often bold
              
              const isItalic = lowerName.includes('italic') ||
                              lowerName.includes('oblique') ||
                              lowerName.includes('it') ||
                              lowerName.includes('slanted');
              
              console.log(`Found font in PDF: "${fontName}" -> "${actualFontName}" (size: ${fontSize}px, bold: ${isBold}, italic: ${isItalic}${baseFontName ? `, baseFont: ${baseFontName}` : ''})`);
              layout.fonts.set(fontName, {
                name: actualFontName, // Use extracted/cleaned font name
                originalName: fontName, // Keep original for reference
                baseFont: baseFontName,
                size: fontSize,
                weight: isBold ? 'bold' : 'normal',
                style: isItalic ? 'italic' : 'normal',
                transform: item.transform || [1, 0, 0, 1, 0, 0]
              });
            }
          }
        });
        
        // Log all fonts found for debugging
        if (layout.fonts.size > 0) {
          console.log(`Extracted ${layout.fonts.size} unique font(s) from PDF:`, Array.from(layout.fonts.keys()));
        }
      }

      // Extract graphics (lines, shapes, etc.) from operator list
      const graphics = extractGraphics(operatorList, viewport);
      pageLayout.graphics = graphics;
      
      // Log graphics extraction for debugging
      if (graphics.length > 0) {
        console.log(`Page ${pageIndex + 1}: Extracted ${graphics.length} graphic elements (lines, shapes, etc.)`);
        graphics.slice(0, 5).forEach((g, idx) => {
          console.log(`  Graphic ${idx + 1}: type=${g.type}, hasPath=${!!g.path}, hasRect=${g.type === 'rectangle'}`);
        });
      } else {
        console.log(`Page ${pageIndex + 1}: No graphics extracted (might be text-based separators or embedded in fonts)`);
      }

      layout.pages.push(pageLayout);
    }

    // Convert fonts Map to array for JSON serialization
    layout.fonts = Array.from(layout.fonts.values());

    return layout;
  } catch (error) {
    console.error('Error extracting PDF layout:', error);
    throw new Error(`Failed to extract PDF layout: ${error.message}`);
  }
}

/**
 * Extract text regions with bounding boxes and styling
 * @param {Array} textItems - Text items from pdfjs
 * @param {Object} viewport - Page viewport
 * @returns {Array} Text regions with positions and metadata
 */
function extractTextRegions(textItems, viewport) {
  const regions = [];
  
  // First, group text items that are on the same line (similar Y coordinate)
  // This helps combine words/phrases that should be on the same line
  const LINE_TOLERANCE = 2; // 2px tolerance for "same line"
  
  // Group items by line (Y coordinate)
  const lines = new Map();
  textItems.forEach((item) => {
    const transform = item.transform || [1, 0, 0, 1, 0, 0];
    const yPdf = transform[5]; // PDF coordinate (bottom-left origin)
    const lineKey = Math.round(yPdf / LINE_TOLERANCE);
    
    if (!lines.has(lineKey)) {
      lines.set(lineKey, []);
    }
    lines.get(lineKey).push(item);
  });
  
  // Process each line, combining text items on the same line
  Array.from(lines.entries()).sort((a, b) => b[0] - a[0]).forEach(([lineKey, lineItems]) => {
    // Sort items on the line by X coordinate (left to right)
    lineItems.sort((a, b) => {
      const xA = (a.transform || [1, 0, 0, 1, 0, 0])[4];
      const xB = (b.transform || [1, 0, 0, 1, 0, 0])[4];
      return xA - xB;
    });
    
    // Combine items on the same line into regions
    // If items are close together horizontally, combine them; otherwise keep separate
    let currentGroup = [];
    let currentGroupX = null;
    const GROUP_X_TOLERANCE = 50; // 50px - items within this are likely on same logical line
    
    lineItems.forEach((item, itemIndex) => {
      const transform = item.transform || [1, 0, 0, 1, 0, 0];
      const x = transform[4];
      const yPdf = transform[5];
      
      // Check if this item should be grouped with the previous
      if (currentGroup.length > 0 && currentGroupX !== null && Math.abs(x - (currentGroupX + (currentGroup[currentGroup.length - 1].width || 0))) < GROUP_X_TOLERANCE) {
        // Part of same logical line - add to current group
        currentGroup.push(item);
      } else {
        // Start a new group - save previous group if it exists
        if (currentGroup.length > 0) {
          // Create a combined region from the group
          regions.push(createRegionFromItems(currentGroup, viewport));
        }
        currentGroup = [item];
        currentGroupX = x;
      }
      
      // If this is the last item in the line, save the group
      if (itemIndex === lineItems.length - 1 && currentGroup.length > 0) {
        regions.push(createRegionFromItems(currentGroup, viewport));
      }
    });
  });
  
  // Set correct indices after all regions are created
  regions.forEach((region, idx) => {
    region.index = idx;
  });
  
  // Calculate spacing from previous region for each region
  regions.forEach((region, index) => {
    if (index > 0) {
      const prevRegion = regions[index - 1];
      if (prevRegion.bbox) {
        const verticalSpacing = Math.abs(region.bbox.y - prevRegion.bbox.y);
        region.spacingFromPrevious = verticalSpacing;
      }
    }
  });
  
  return regions;
}

/**
 * Create a text region from one or more text items (combines items on the same line)
 */
function createRegionFromItems(items, viewport) {
  if (items.length === 0) return null;
  
  // Use the first item for positioning and font info
  const firstItem = items[0];
  const transform = firstItem.transform || [1, 0, 0, 1, 0, 0];
  const x = transform[4];
  const yPdf = transform[5];
  const y = viewport.height - yPdf;
  
  const fontSize = firstItem.height || 12;
  const fontName = firstItem.fontName || 'Helvetica';
  
  // Combine text from all items (add space between items that are separated)
  let combinedText = '';
  let lastX = x;
  items.forEach((item, idx) => {
    const itemTransform = item.transform || [1, 0, 0, 1, 0, 0];
    const itemX = itemTransform[4];
    
    // Add space if there's a gap between items
    if (idx > 0 && itemX > lastX + (items[idx - 1].width || 0) + 2) {
      combinedText += ' ';
    }
    
    combinedText += (item.str || '');
    lastX = itemX + (item.width || 0);
  });
  
  // Find the rightmost X position
  const rightmostX = Math.max(...items.map(item => {
    const t = item.transform || [1, 0, 0, 1, 0, 0];
    return t[4] + (item.width || 0);
  }));
  
  // Calculate bounding box with proper baseline
  const bbox = {
    x: x,
    y: yPdf, // Store PDF coordinate for baseline
    width: rightmostX - x,
    height: fontSize,
    left: x,
    right: rightmostX,
    top: yPdf + fontSize,
    bottom: yPdf,
    screenX: x,
    screenY: y - fontSize,
    screenTop: y - fontSize,
    screenBottom: y
  };

  // Extract text color from first item
  let color = '#000000';
  if (firstItem.color) {
    if (typeof firstItem.color === 'string') {
      color = firstItem.color;
    } else if (Array.isArray(firstItem.color)) {
      const [r = 0, g = 0, b = 0] = firstItem.color;
      color = `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`;
    }
  }

  // Detect formatting
  const isBullet = /^[●•\-*]\s/.test(combinedText.trim());
  const isBold = fontName?.toLowerCase().includes('bold') || fontSize > 14;
  const isItalic = fontName?.toLowerCase().includes('italic') || fontName?.toLowerCase().includes('oblique');
  
  return {
    index: 0, // Will be set correctly after all regions are created
    text: combinedText,
    bbox,
    font: {
      name: fontName,
      size: fontSize,
      style: isBold ? 'bold' : isItalic ? 'italic' : 'normal',
      weight: isBold ? 'bold' : 'normal'
    },
    color,
    transform,
    isBullet,
    isBold,
    isItalic,
    spacingFromPrevious: null, // Will be calculated later
    alignment: x < viewport.width * 0.1 ? 'left' : 
               x > viewport.width * 0.9 ? 'right' : 
               Math.abs(x - viewport.width / 2) < 20 ? 'center' : 'left'
  };
}

/**
 * Extract graphics (lines, shapes, etc.) from operator list
 * @param {Object} operatorList - PDF operator list
 * @param {Object} viewport - Page viewport
 * @returns {Array} Graphics elements
 */
function extractGraphics(operatorList, viewport) {
  const graphics = [];
  
  // Check if operatorList is valid
  if (!operatorList || !operatorList.fnArray || !operatorList.argsArray) {
    console.warn('Invalid operator list for graphics extraction');
    return graphics;
  }
  
  const { fnArray, argsArray } = operatorList;
  
  // Track current graphics state
  let currentPath = [];
  let strokeColor = '#000000';
  let fillColor = '#000000';
  let lineWidth = 1;
  
  for (let i = 0; i < fnArray.length; i++) {
    const op = fnArray[i];
    const args = argsArray[i];
    
    // Extract color operations
    if (op === 23 || op === 24) { // SetStrokeColor or SetFillColor
      const color = extractColorFromArgs(args);
      if (op === 23) strokeColor = color;
      else fillColor = color;
    }
    
    // Extract line width
    if (op === 32 && args && args.length > 0) { // SetLineWidth
      lineWidth = args[0] || 1;
    }
    
    // Extract path operations (lines, rectangles, etc.)
    if (op === 25) { // Stroke path
      if (currentPath.length > 0) {
        graphics.push({
          type: 'path',
          path: [...currentPath],
          strokeColor,
          lineWidth
        });
        currentPath = [];
      }
    }
    
    if (op === 26) { // Fill path
      if (currentPath.length > 0) {
        graphics.push({
          type: 'fill',
          path: [...currentPath],
          fillColor
        });
        currentPath = [];
      }
    }
    
    // Track path construction (simplified - full implementation would handle all path ops)
    if (op === 3 || op === 4) { // MoveTo or LineTo
      if (args && args.length >= 2) {
        const x = args[0];
        const yPdf = args[1]; // Keep PDF coordinates (bottom-left origin)
        // Store both PDF coords (for redrawing) and screen coords (for reference)
        currentPath.push({ 
          x, 
          y: yPdf, // PDF coordinate (bottom-left origin) - use this for redrawing
          screenY: viewport.height - yPdf // Screen coordinate for reference
        });
      }
    }
    
    // Handle rectangle drawing (common in resumes for lines/borders)
    if (op === 35) { // re (rectangle)
      if (args && args.length >= 4) {
        const x = args[0];
        const yPdf = args[1];
        const width = args[2];
        const height = args[3];
        graphics.push({
          type: 'rectangle',
          x, y: yPdf, width, height,
          strokeColor,
          fillColor,
          lineWidth
        });
      }
    }
  }
  
  return graphics;
}

/**
 * Extract color from PDF operator arguments
 * @param {Array} args - Operator arguments
 * @returns {String} Hex color string
 */
function extractColorFromArgs(args) {
  if (!args || args.length === 0) return '#000000';
  
  // RGB values are typically 0-1 range
  if (args.length >= 3) {
    const [r = 0, g = 0, b = 0] = args;
    return `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`;
  }
  
  // Grayscale
  if (args.length === 1) {
    const gray = Math.round(args[0] * 255);
    return `#${gray.toString(16).padStart(2, '0').repeat(3)}`;
  }
  
  return '#000000';
}

/**
 * Map text regions to resume sections based on content analysis
 * @param {Array} textRegions - Extracted text regions
 * @param {String} pageText - Full page text for context
 * @returns {Object} Mapping of section names to text regions
 */
export function mapTextRegionsToSections(textRegions, pageText) {
  const mapping = {
    contactInfo: [],
    summary: [],
    experience: [],
    skills: [],
    education: [],
    projects: [],
    certifications: [],
    other: []
  };

  const lowerText = pageText.toLowerCase();
  const sectionHeaders = {
    contact: ['name', 'email', 'phone', 'address', 'location'],
    summary: ['summary', 'profile', 'objective'],
    experience: ['experience', 'employment', 'work history', 'professional experience'],
    skills: ['skills', 'technical skills', 'competencies'],
    education: ['education', 'academic', 'degree'],
    projects: ['projects', 'portfolio'],
    certifications: ['certifications', 'certificates', 'credentials']
  };

  // CRITICAL: Sort regions by vertical position first (top to bottom)
  // PDF coordinates: larger Y = higher on page (bottom-left origin)
  const sortedRegions = [...textRegions].sort((a, b) => {
    const yA = a.bbox?.bottom !== undefined ? a.bbox.bottom : (a.bbox?.y || 0);
    const yB = b.bbox?.bottom !== undefined ? b.bbox.bottom : (b.bbox?.y || 0);
    return yB - yA; // Sort descending (top to bottom)
  });

  let currentSection = null;

  sortedRegions.forEach((region, index) => {
    const regionText = region.text.toLowerCase().trim();
    
    // Check if this region matches a section header
    let matched = false;
    for (const [section, keywords] of Object.entries(sectionHeaders)) {
      if (keywords.some(keyword => regionText.includes(keyword))) {
        // Map section names to our mapping keys
        let mappingKey = section;
        if (section === 'contact') mappingKey = 'contactInfo';
        
        mapping[mappingKey] = mapping[mappingKey] || [];
        mapping[mappingKey].push({
          ...region,
          isHeader: true,
          sectionType: section
        });
        currentSection = mappingKey;
        matched = true;
        break;
      }
    }
    
    // If not a header, assign to current section (based on position in document)
    if (!matched) {
      if (currentSection) {
        mapping[currentSection] = mapping[currentSection] || [];
        mapping[currentSection].push({
          ...region,
          isHeader: false,
          sectionType: currentSection
        });
      } else {
        // Check if this might be contact info (name at top, large font)
        if (index < 5 && region.font?.size > 16) {
          mapping.contactInfo.push(region);
        } else {
          mapping.other.push(region);
        }
      }
    }
  });

  return mapping;
}

