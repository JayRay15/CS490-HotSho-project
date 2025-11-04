/**
 * PDF Generator Service
 * Generates pixel-perfect PDFs that match the original template layout exactly
 * Only text content is replaced, all graphics, positioning, and styling are preserved
 */

import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

/**
 * Generate a PDF resume from a template with new content
 * Preserves exact layout, fonts, colors, and graphics from the original
 * @param {Object} template - Resume template with originalPdf and pdfLayout
 * @param {Object} resumeData - Resume data to insert (sections object)
 * @param {Object} options - Generation options
 * @returns {Promise<Buffer>} Generated PDF buffer
 */
export async function generatePdfFromTemplate(template, resumeData, options = {}) {
  const { strictLayoutMode = true, templateFormats = {} } = options;

  if (!template.originalPdf) {
    throw new Error('Template does not have original PDF stored. Please re-upload the template PDF.');
  }

  if (!template.pdfLayout || !template.pdfLayout.pages || template.pdfLayout.pages.length === 0) {
    throw new Error('Template does not have layout metadata. Please re-upload the template.');
  }

  console.log('🔄 Starting PDF generation from template...');
  
  // Load the original PDF template - pdf-lib automatically preserves all graphics, fonts, and structure
  // Handle different buffer formats from MongoDB/Mongoose
  let pdfBuffer;
  
  console.log(`🔍 PDF buffer type: ${typeof template.originalPdf}, isBuffer: ${Buffer.isBuffer(template.originalPdf)}`);
  
  if (Buffer.isBuffer(template.originalPdf)) {
    // Already a Buffer
    pdfBuffer = template.originalPdf;
    console.log(`   ✓ Using Buffer directly (${pdfBuffer.length} bytes)`);
  } else if (template.originalPdf && typeof template.originalPdf === 'object') {
    // Mongoose serializes Buffer as { type: 'Buffer', data: [array of numbers] }
    if (template.originalPdf.type === 'Buffer' && Array.isArray(template.originalPdf.data)) {
      pdfBuffer = Buffer.from(template.originalPdf.data);
      console.log(`   ✓ Converted from Mongoose Buffer format (${pdfBuffer.length} bytes)`);
    } else if (Array.isArray(template.originalPdf.data)) {
      // Alternative format
      pdfBuffer = Buffer.from(template.originalPdf.data);
      console.log(`   ✓ Converted from object.data array (${pdfBuffer.length} bytes)`);
    } else if (Array.isArray(template.originalPdf)) {
      // Direct array
      pdfBuffer = Buffer.from(template.originalPdf);
      console.log(`   ✓ Converted from array (${pdfBuffer.length} bytes)`);
    } else {
      console.error('   ❌ Unknown object format:', Object.keys(template.originalPdf));
      throw new Error('Template originalPdf is in an unsupported object format. Please re-upload the template PDF.');
    }
  } else if (typeof template.originalPdf === 'string') {
    // Base64 string
    pdfBuffer = Buffer.from(template.originalPdf, 'base64');
    console.log(`   ✓ Converted from base64 string (${pdfBuffer.length} bytes)`);
  } else {
    console.error(`   ❌ Invalid type: ${typeof template.originalPdf}`);
    throw new Error(`Template originalPdf is missing or in an invalid format (type: ${typeof template.originalPdf}). Please re-upload the template PDF.`);
  }
  
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error('Template PDF buffer is empty (0 bytes). The PDF was not saved correctly. Please re-upload the template PDF.');
  }
  
  // Validate it's actually a PDF by checking the header
  const pdfHeader = pdfBuffer.slice(0, 4).toString();
  if (pdfHeader !== '%PDF') {
    console.error('Invalid PDF header:', pdfHeader, 'First 50 bytes:', pdfBuffer.slice(0, 50).toString());
    throw new Error(`Invalid PDF format. Expected PDF header "%PDF" but got "${pdfHeader}". The PDF may be corrupted. Please re-upload the template.`);
  }
  
  console.log(`📄 Loading PDF template (${Math.round(pdfBuffer.length / 1024)}KB)...`);
  
  // Load PDF - this preserves ALL content including graphics, lines, separators
  let pdfDoc;
  try {
    pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: false });
  } catch (loadError) {
    console.error('Failed to load PDF:', loadError.message);
    console.error('PDF buffer first 100 bytes:', pdfBuffer.slice(0, 100).toString());
    throw new Error(`Failed to load PDF template: ${loadError.message}. The PDF may be corrupted. Please re-upload the template.`);
  }
  const pages = pdfDoc.getPages();
  const layout = template.pdfLayout;

  console.log(`✅ Loaded PDF with ${pages.length} page(s). Layout has ${layout.pages?.length || 0} page(s) of metadata.`);

  // Get fonts - pdf-lib preserves fonts from original, we just need to access them
  const fonts = await getFontsForDocument(pdfDoc, layout.fonts, pdfBuffer);
  
  console.log(`📝 Available fonts: ${Object.keys(fonts).join(', ') || 'default'}`);

      // Process each page - SIMPLIFIED APPROACH: Just overlay new text, let pdf-lib preserve everything else
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const page = pages[pageIndex];
        const pageLayout = layout.pages[pageIndex];
        
        if (!pageLayout) {
          console.log(`⚠️ Page ${pageIndex + 1} has no layout metadata, skipping...`);
          continue;
        }

        const { width, height } = page.getSize();
        console.log(`📄 Processing page ${pageIndex + 1} (${Math.round(width)}x${Math.round(height)})...`);

        // STRATEGY: pdf-lib preserves ALL graphics automatically when loading
        // We just need to mask old text and add new text at the same positions
        // Graphics (lines, separators) will remain untouched
        
            // Step 1: Mask old text with white rectangles (precise, minimal padding)
            // SKIP section headers - they should remain visible
            if (pageLayout.textRegions && pageLayout.textRegions.length > 0) {
              const textRegionsToMask = pageLayout.textRegions.filter(region => {
                // Skip section headers - keep them visible
                const text = (region.text || '').toLowerCase().trim();
                const sectionHeaders = ['summary', 'experience', 'skills', 'education', 'projects', 'certifications', 'contact'];
                const isHeader = sectionHeaders.some(header => text === header || text.includes(header));
                return !isHeader && !region.isHeader;
              });
              console.log(`  🎨 Masking ${textRegionsToMask.length} text regions (skipped ${pageLayout.textRegions.length - textRegionsToMask.length} headers)...`);
              maskTextRegions(page, textRegionsToMask, height, pageLayout.graphics || []);
            }

        // Step 2: Insert new text at exact same positions
        if (pageLayout.textRegions && pageLayout.textRegions.length > 0) {
          console.log(`  ✍️ Inserting new content...`);
          await insertTextIntoPage(
            page, 
            pageLayout.textRegions, 
            template.sectionMapping, 
            resumeData, 
            fonts,
            { width, height, strictLayoutMode, templateFormats }
          );
        }
        
        // Step 3: Redraw graphics on top (to ensure they're visible above masked areas)
        if (pageLayout.graphics && pageLayout.graphics.length > 0) {
          console.log(`  📐 Redrawing ${pageLayout.graphics.length} graphic elements (lines, separators)...`);
          redrawGraphics(page, pageLayout.graphics, height);
        }
        
        console.log(`✅ Page ${pageIndex + 1} processed.`);
      }

  // UC-51: Add watermark if enabled
  if (options.watermark && options.watermark.enabled && options.watermark.text) {
    console.log(`🏷️ Adding watermark: "${options.watermark.text}"`);
    await addWatermarkToPdf(pdfDoc, options.watermark.text);
  }

  // Save the modified PDF
  console.log('💾 Saving generated PDF...');
  const pdfBytes = await pdfDoc.save();
  console.log(`✅ PDF generated successfully (${Math.round(pdfBytes.length / 1024)}KB)`);
  return Buffer.from(pdfBytes);
}

/**
 * Get fonts for the document, embedding standard fonts or using existing ones
 * @param {PDFDocument} pdfDoc - PDF document (already loaded from original)
 * @param {Array} fontMetadata - Font metadata from layout extraction
 * @param {Buffer} originalPdfBuffer - Original PDF buffer (for font extraction)
 * @returns {Object} Map of font names to PDFFont objects
 */
async function getFontsForDocument(pdfDoc, fontMetadata, originalPdfBuffer) {
  const fonts = {};
  
  // pdf-lib preserves fonts when loading - fonts are already in the document
  // However, we can't easily access them directly, so we'll map font metadata to standard fonts
  // and store font size/style information for each font name

  // Map of standard font names to pdf-lib StandardFonts
  const standardFonts = {
    'Helvetica': StandardFonts.Helvetica,
    'Helvetica-Bold': StandardFonts.HelveticaBold,
    'Helvetica-Oblique': StandardFonts.HelveticaOblique,
    'Helvetica-BoldOblique': StandardFonts.HelveticaBoldOblique,
    'Times-Roman': StandardFonts.TimesRoman,
    'Times-Bold': StandardFonts.TimesBold,
    'Times-Italic': StandardFonts.TimesItalic,
    'Times-BoldItalic': StandardFonts.TimesBoldItalic,
    'Courier': StandardFonts.Courier,
    'Courier-Bold': StandardFonts.CourierBold,
    'Courier-Oblique': StandardFonts.CourierOblique,
    'Courier-BoldOblique': StandardFonts.CourierBoldOblique,
  };

  // Store font metadata (size, style) with font names for later use
  const fontInfoMap = new Map();

  // Create font mappings based on font metadata
  // fontMetadata is a Map from extractPdfLayout
  const fontMetadataArray = fontMetadata instanceof Map 
    ? Array.from(fontMetadata.entries()) 
    : (Array.isArray(fontMetadata) ? fontMetadata.map((f, i) => [f.name || `font_${i}`, f]) : []);
    
  if (fontMetadataArray && fontMetadataArray.length > 0) {
    // Group fonts by size and style to infer the actual font family
    // Larger fonts (typically > 14px) are often headings, smaller are body text
    // Very large fonts (> 20px) are likely bold headings
    
    for (const [fontKey, fontInfo] of fontMetadataArray) {
      const fontName = fontInfo.name || fontKey || 'Helvetica';
      const fontSize = fontInfo.size || 12;
      
      // Store font info for later matching
      fontInfoMap.set(fontName, { size: fontSize, style: fontInfo.style, weight: fontInfo.weight });
      
      // Match font based on weight, style, and size
      // Priority: weight/style > size > default
      let matchedFont = StandardFonts.Helvetica; // Default
      
      const isBold = fontInfo.weight === 'bold' || 
                     fontName.toLowerCase().includes('bold') ||
                     fontName.toLowerCase().includes('bd');
      const isItalic = fontInfo.style === 'italic' || 
                       fontName.toLowerCase().includes('italic') ||
                       fontName.toLowerCase().includes('oblique') ||
                       fontName.toLowerCase().includes('it');
      
      // Match based on bold/italic combination first
      if (isBold && isItalic) {
        matchedFont = StandardFonts.HelveticaBoldOblique;
      } else if (isBold) {
        matchedFont = StandardFonts.HelveticaBold;
      } else if (isItalic) {
        matchedFont = StandardFonts.HelveticaOblique;
      }
      // If no explicit bold/italic but font is large, likely bold
      else if (fontSize > 20) {
        matchedFont = StandardFonts.HelveticaBold;
      } 
      // If font is medium-large (14-20px), check context
      else if (fontSize >= 14) {
        // Might be a heading - use regular but could be bold
        // Check if it's clearly a heading by size
        matchedFont = StandardFonts.Helvetica;
      }
      // Small fonts (< 14px) are typically body text - use regular
      else {
        matchedFont = StandardFonts.Helvetica;
      }
      
      // Try to match by name patterns if available
      const lowerName = fontName.toLowerCase();
      if (lowerName.includes('times') || lowerName.includes('roman')) {
        matchedFont = fontSize > 20 ? StandardFonts.TimesBold : StandardFonts.TimesRoman;
      } else if (lowerName.includes('courier')) {
        matchedFont = fontSize > 20 ? StandardFonts.CourierBold : StandardFonts.Courier;
      } else if (lowerName.includes('bold')) {
        matchedFont = StandardFonts.HelveticaBold;
      } else if (lowerName.includes('italic') || lowerName.includes('oblique')) {
        matchedFont = StandardFonts.HelveticaOblique;
      }
      
      // Embed the font and store it with the original font name
      if (!fonts[fontName]) {
        const embeddedFont = await pdfDoc.embedFont(matchedFont);
        fonts[fontName] = embeddedFont;
        console.log(`  ✓ Mapped font "${fontName}" (size: ${fontSize}px) to ${matchedFont}`);
      }
    }
  }

  // Store font info map for later use in insertTextAtRegion
  fonts._fontInfoMap = fontInfoMap;

  // Ensure we have at least a default font
  if (Object.keys(fonts).filter(k => k !== '_fontInfoMap').length === 0) {
    fonts['Helvetica'] = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  return fonts;
}

/**
 * Mask text regions with white rectangles to hide original text
 * @param {PDFPage} page - PDF page to modify
 * @param {Array} textRegions - Text regions from layout extraction
 * @param {Number} pageHeight - Page height for coordinate conversion
 */
function maskTextRegions(page, textRegions, pageHeight, graphics = []) {
  textRegions.forEach(region => {
    const bbox = region.bbox;
    if (!bbox) return;

    // Skip regions that are too small (likely artifacts)
    const width = bbox.width || (bbox.right - bbox.left) || 0;
    const fontSize = region.font?.size || bbox.height || 12;
    if (width < 1 || fontSize < 1) return;

    // Use PDF coordinates directly
    // bbox.bottom is the baseline in PDF coords, bbox.top is above it
    const x = bbox.x || bbox.left || 0;
    const baselineY = bbox.bottom !== undefined ? bbox.bottom : bbox.y;
    // Height goes from baseline up - add small padding for better coverage
    const height = bbox.top !== undefined ? (bbox.top - bbox.bottom) : fontSize;
    
    // Skip masking if height is invalid
    if (height <= 0) return;

    // Check if this text region overlaps with any graphics
    // If it does, we'll mask more carefully or skip masking that part
    const textRect = {
      x: x,
      y: baselineY,
      width: width,
      height: height
    };
    
    // Check for overlap with graphics
    let overlapsGraphic = false;
    for (const graphic of graphics) {
      if (graphic.type === 'path' && graphic.path && graphic.path.length > 0) {
        // Check if text overlaps with path
        // Simple bounding box check
        for (const point of graphic.path) {
          if (point.x >= textRect.x && point.x <= textRect.x + textRect.width &&
              point.y >= textRect.y && point.y <= textRect.y + textRect.height) {
            overlapsGraphic = true;
            break;
          }
        }
        if (overlapsGraphic) break;
      } else if (graphic.type === 'rectangle') {
        // Check rectangle overlap
        const gRect = graphic;
        if (!(textRect.x + textRect.width < gRect.x || 
              textRect.x > gRect.x + gRect.width ||
              textRect.y + textRect.height < gRect.y ||
              textRect.y > gRect.y + gRect.height)) {
          overlapsGraphic = true;
          break;
        }
      }
    }

    // Draw white rectangle to mask ONLY the text region
    // Use minimal padding to avoid covering nearby graphics
    // If it overlaps with graphics, we'll be more careful (graphics will be redrawn on top)
    const padding = overlapsGraphic ? 0 : 1; // Small padding for better coverage
    const maskX = Math.max(0, x - padding);
    const maskY = Math.max(0, baselineY - padding); // Start from baseline
    const maskWidth = Math.min(width + (padding * 2), page.getWidth() - maskX);
    const maskHeight = height + (padding * 2);
    
    // Only mask if dimensions are valid
    if (maskWidth > 0 && maskHeight > 0) {
      page.drawRectangle({
        x: maskX,
        y: maskY,
        width: maskWidth,
        height: maskHeight,
        color: rgb(1, 1, 1), // White
        opacity: 1.0, // Fully opaque
      });
    }
  });
}

/**
 * Redraw graphics (lines, shapes) from the original template
 * This ensures graphics are visible on top of masked text regions
 */
function redrawGraphics(page, graphics, pageHeight) {
  if (!graphics || graphics.length === 0) return;
  
  graphics.forEach(graphic => {
    try {
      if (graphic.type === 'path' && graphic.path && graphic.path.length > 0) {
        // Draw a line or path
        const path = graphic.path;
        const color = parseColor(graphic.strokeColor || '#000000');
        const lineWidth = graphic.lineWidth || 1;
        
        // Draw line segments
        // Path points use PDF coordinates (bottom-left origin)
        for (let i = 0; i < path.length - 1; i++) {
          const start = path[i];
          const end = path[i + 1];
          
          // Use PDF coordinates directly (y is already in PDF coords from extraction)
          page.drawLine({
            start: { x: start.x, y: start.y },
            end: { x: end.x, y: end.y },
            thickness: lineWidth,
            color: color,
          });
        }
      } else if (graphic.type === 'rectangle') {
        // Draw rectangle (common for lines/borders in resumes)
        const color = parseColor(graphic.strokeColor || '#000000');
        const lineWidth = graphic.lineWidth || 1;
        
        // Draw rectangle outline
        // Coordinates are in PDF format (bottom-left origin)
        page.drawRectangle({
          x: graphic.x,
          y: graphic.y,
          width: graphic.width,
          height: graphic.height,
          borderColor: color,
          borderWidth: lineWidth,
        });
      } else if (graphic.type === 'fill' && graphic.path && graphic.path.length > 0) {
        // Draw filled shape - for rectangles, we can use drawRectangle
        // For complex paths, we'd need to use a more complex API
        // For now, skip filled paths as they're less common
      }
    } catch (error) {
      console.warn('Error redrawing graphic:', error);
      // Continue with other graphics
    }
  });
  
  console.log(`Redrew ${graphics.length} graphic elements`);
}

/**
 * Parse color string (hex, rgb, etc.) to rgb object for pdf-lib
 */
function parseColor(colorStr) {
  if (!colorStr) return rgb(0, 0, 0);
  
  // Handle hex colors
  if (colorStr.startsWith('#')) {
    const hex = colorStr.slice(1);
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return rgb(r, g, b);
  }
  
  // Default to black
  return rgb(0, 0, 0);
}

/**
 * Insert text into a page at exact positions from the template
 * @param {PDFPage} page - PDF page to modify
 * @param {Array} textRegions - Text regions from layout extraction
 * @param {Object} sectionMapping - Mapping of regions to resume sections
 * @param {Object} resumeData - Resume data to insert
 * @param {Object} fonts - Available fonts
 * @param {Object} options - Options including page dimensions
 */
async function insertTextIntoPage(page, textRegions, sectionMapping, resumeData, fonts, options) {
  const { width, height, strictLayoutMode } = options;
  
  console.log(`    📍 Found ${textRegions.length} text regions, section mapping:`, sectionMapping ? Object.keys(sectionMapping).join(', ') : 'none');

  // Helper function to sort regions by vertical position (top to bottom), then by horizontal (left to right)
  // PDF coordinates: larger Y = higher on page (bottom-left origin)
  const sortRegionsByPosition = (regions) => {
    return [...regions].sort((a, b) => {
      // Get Y coordinate (bottom of text in PDF coords)
      const yA = a.bbox?.bottom !== undefined ? a.bbox.bottom : (a.bbox?.y || 0);
      const yB = b.bbox?.bottom !== undefined ? b.bbox.bottom : (b.bbox?.y || 0);
      
      // Primary sort: Y coordinate (top to bottom = descending Y in PDF coords)
      if (Math.abs(yB - yA) > 2) { // More than 2px difference = different line
        return yB - yA;
      }
      
      // Secondary sort: X coordinate (left to right) for same line
      const xA = a.bbox?.x !== undefined ? a.bbox.x : (a.bbox?.left || 0);
      const xB = b.bbox?.x !== undefined ? b.bbox.x : (b.bbox?.left || 0);
      return xA - xB;
    });
  };
  
  // Helper function to deduplicate and combine regions that are on the same line
  // Multiple text items on the same line should be treated as separate regions,
  // but we should remove true duplicates (exact same position)
  const deduplicateRegions = (regions) => {
    const seen = new Map(); // Map of position key to region
    const deduplicated = [];
    const Y_TOLERANCE = 2; // 2px tolerance for "same line" in Y
    const X_TOLERANCE = 5; // 5px tolerance for "same position" in X
    
    regions.forEach(region => {
      const y = region.bbox?.bottom !== undefined ? region.bbox.bottom : (region.bbox?.y || 0);
      const x = region.bbox?.x !== undefined ? region.bbox.x : (region.bbox?.left || 0);
      
      // Create a key based on rounded Y position (same line) and rounded X (same horizontal position)
      const yKey = Math.round(y / Y_TOLERANCE);
      const xKey = Math.round(x / X_TOLERANCE);
      const positionKey = `${yKey}_${xKey}`;
      
      // Check if we've already seen a region at this exact position
      if (!seen.has(positionKey)) {
        seen.set(positionKey, region);
        deduplicated.push(region);
      } else {
        // Same position - check if the existing region is empty or shorter, replace with longer text
        const existing = seen.get(positionKey);
        const existingText = (existing.text || '').trim();
        const newText = (region.text || '').trim();
        
        // If new text is longer and more meaningful, use it instead
        if (newText.length > existingText.length && newText.length > 3) {
          const index = deduplicated.indexOf(existing);
          if (index >= 0) {
            deduplicated[index] = region;
            seen.set(positionKey, region);
          }
        }
      }
    });
    
    // Sort again after deduplication to ensure proper order
    return deduplicated.sort((a, b) => {
      const yA = a.bbox?.bottom !== undefined ? a.bbox.bottom : (a.bbox?.y || 0);
      const yB = b.bbox?.bottom !== undefined ? b.bbox.bottom : (b.bbox?.y || 0);
      
      if (Math.abs(yB - yA) > 2) {
        return yB - yA; // Sort by Y (top to bottom)
      }
      
      const xA = a.bbox?.x !== undefined ? a.bbox.x : (a.bbox?.left || 0);
      const xB = b.bbox?.x !== undefined ? b.bbox.x : (b.bbox?.left || 0);
      return xA - xB; // Then by X (left to right)
    });
  };

  // Group text regions by section
  const sectionsByType = {
    contactInfo: [],
    summary: [],
    experience: [],
    skills: [],
    education: [],
    projects: [],
    certifications: [],
    other: []
  };

  if (sectionMapping) {
    Object.keys(sectionsByType).forEach(section => {
      if (sectionMapping[section] && Array.isArray(sectionMapping[section])) {
        // CRITICAL: Sort regions by vertical position to preserve template order
        // Filter out section headers - they shouldn't be replaced with content
        const regionsForSection = sectionMapping[section].filter(region => {
          const text = (region.text || '').toLowerCase().trim();
          const sectionHeaders = ['summary', 'experience', 'skills', 'education', 'projects', 'certifications'];
          const isHeader = sectionHeaders.some(header => text === header || text.includes(header)) || region.isHeader;
          return !isHeader;
        });
        // Sort and deduplicate regions to prevent overlapping text
        const sortedRegions = sortRegionsByPosition(regionsForSection);
        sectionsByType[section] = deduplicateRegions(sortedRegions);
        console.log(`    ✓ Mapped ${sectionsByType[section].length} regions to "${section}" section (sorted & deduplicated, ${sectionMapping[section].length - sectionsByType[section].length} headers/duplicates skipped)`);
      }
    });
  } else {
    // Fallback: use all text regions in order if no mapping available
    // Sort by position to maintain original order, skip headers
    const nonHeaderRegions = textRegions.filter(region => {
      const text = (region.text || '').toLowerCase().trim();
      const sectionHeaders = ['summary', 'experience', 'skills', 'education', 'projects', 'certifications'];
      return !sectionHeaders.some(header => text === header || text.includes(header)) && !region.isHeader;
    });
    const sortedOther = sortRegionsByPosition(nonHeaderRegions);
    sectionsByType.other = deduplicateRegions(sortedOther);
    console.log(`    ⚠️ No section mapping - will use ${sectionsByType.other.length} regions in order (sorted & deduplicated, ${textRegions.length - sectionsByType.other.length} headers/duplicates skipped)`);
  }

  // Map resume data to text regions
  // Contact Info
  const contactData = resumeData.sections?.contactInfo || {};
  insertContactInfo(page, sectionsByType.contactInfo, contactData, fonts, height);

  // Summary
  const summary = resumeData.sections?.summary || '';
  insertSummary(page, sectionsByType.summary, summary, fonts, height);

  // Experience
  const experience = resumeData.sections?.experience || [];
  insertExperience(page, sectionsByType.experience, experience, fonts, height, options.templateFormats);

  // Skills
  const skills = resumeData.sections?.skills || [];
  insertSkills(page, sectionsByType.skills, skills, fonts, height);

  // Education
  const education = resumeData.sections?.education || [];
  insertEducation(page, sectionsByType.education, education, fonts, height, options.templateFormats);

  // Projects
  const projects = resumeData.sections?.projects || [];
  insertProjects(page, sectionsByType.projects, projects, fonts, height, options.templateFormats);

  // For other regions, keep original text or leave blank
  if (strictLayoutMode && sectionsByType.other.length > 0) {
    // Optionally: remove or leave blank other regions
  }
}

/**
 * Insert contact information
 */
function insertContactInfo(page, regions, contactData, fonts, pageHeight) {
  if (!regions || regions.length === 0) {
    console.warn('  ⚠️ No contact regions available');
    return;
  }

  const name = contactData.name || '';
  const email = contactData.email || '';
  const phone = contactData.phone || '';
  const location = contactData.location || '';

  // Sort regions by vertical position (top to bottom) - name should be at top
  const sortedRegions = [...regions].sort((a, b) => {
    const yA = a.bbox?.bottom !== undefined ? a.bbox.bottom : (a.bbox?.y || 0);
    const yB = b.bbox?.bottom !== undefined ? b.bbox.bottom : (b.bbox?.y || 0);
    return yB - yA; // Descending (top to bottom)
  });

  // Find name region (usually first/top region with largest font)
  const nameRegion = sortedRegions.find(r => 
    r.font?.size > 20 || 
    (r.text && r.text.toLowerCase().match(/^[a-z\s]+$/i) && r.text.length > 5)
  ) || sortedRegions[0];

  if (nameRegion && name) {
    console.log(`  📝 Inserting name "${name}" into region at (${nameRegion.bbox?.x || '?'}, ${nameRegion.bbox?.bottom || '?'}), font size: ${nameRegion.font?.size || '?'}`);
    insertTextAtRegion(page, nameRegion, name, fonts, pageHeight);
  } else {
    console.warn(`  ⚠️ No name region found or name is empty (regions: ${sortedRegions.length}, name: "${name}")`);
  }

  // Insert contact details into remaining regions (skip name region)
  const contactParts = [email, phone, location].filter(Boolean);
  let contactIndex = 0;
  
  sortedRegions.forEach((region, idx) => {
    // Skip the name region and any headers
    if (region !== nameRegion && !region.isHeader && contactIndex < contactParts.length) {
      const contactValue = contactParts[contactIndex];
      if (contactValue) {
        console.log(`  📝 Inserting contact "${contactValue}" into region at (${region.bbox?.x || '?'}, ${region.bbox?.bottom || '?'})`);
        insertTextAtRegion(page, region, contactValue, fonts, pageHeight);
        contactIndex++;
      }
    }
  });
}

/**
 * Insert summary text
 */
function insertSummary(page, regions, summary, fonts, pageHeight) {
  if (!regions || regions.length === 0 || !summary) return;

  // Use first region for summary, wrap text if needed
  const firstRegion = regions[0];
  if (firstRegion) {
    insertTextAtRegion(page, firstRegion, summary, fonts, pageHeight, { wrap: true });
  }
}

/**
 * Insert experience entries
 */
function insertExperience(page, regions, experience, fonts, pageHeight, templateFormats = {}) {
  if (!regions || regions.length === 0 || !experience || experience.length === 0) return;

  const experienceFormat = templateFormats.experienceFormat || {};
  
  console.log(`  📝 Inserting ${experience.length} experience entries into ${regions.length} regions`);
  console.log(`  📍 First few region Y positions:`, regions.slice(0, 5).map(r => ({
    y: r.bbox?.bottom || r.bbox?.y,
    text: (r.text || '').substring(0, 30)
  })));

  let regionIndex = 0;
  experience.forEach((job, jobIndex) => {
    if (regionIndex >= regions.length) {
      console.warn(`  ⚠️ Not enough regions for experience entry ${jobIndex + 1} (${regionIndex}/${regions.length}), skipping remaining entries`);
      return;
    }

    // Skip to next region that's on a different line (to avoid overlapping)
    // Find the first region that has a different Y coordinate (different line)
    const currentY = regions[regionIndex]?.bbox?.bottom || regions[regionIndex]?.bbox?.y;
    while (regionIndex < regions.length) {
      const regionY = regions[regionIndex]?.bbox?.bottom || regions[regionIndex]?.bbox?.y;
      if (Math.abs(regionY - currentY) > 2) {
        // Different line found, use this region
        break;
      }
      // Same line, skip this region
      regionIndex++;
    }

    if (regionIndex >= regions.length) {
      console.warn(`  ⚠️ No more regions available for experience entry ${jobIndex + 1}`);
      return;
    }

    // Use template format to determine title/company layout
    const jobTitleRegion = regions[regionIndex];
    if (!jobTitleRegion) {
      console.warn(`  ⚠️ No region available for job ${jobIndex + 1} title`);
      return;
    }
    
    if (job.jobTitle) {
      let jobTitleText = job.jobTitle;
      
      // Check if title and company should be on same line
      if (experienceFormat.titleCompanySameLine && job.company) {
        jobTitleText = `${job.jobTitle} at ${job.company}`;
      } else {
        jobTitleText = job.jobTitle;
      }
      
      insertTextAtRegion(page, jobTitleRegion, jobTitleText, fonts, pageHeight);
      regionIndex++; // Move to next region after using this one
      
      // If company is separate, insert it on next line
      if (!experienceFormat.titleCompanySameLine && job.company && regionIndex < regions.length) {
        const companyRegion = regions[regionIndex];
        if (companyRegion) {
          insertTextAtRegion(page, companyRegion, job.company, fonts, pageHeight);
          regionIndex++; // Move to next region
        }
      }
    } else {
      // No job title, skip this region
      regionIndex++;
    }

    // Insert dates - check if they should be on the right
    if (job.startDate && regionIndex < regions.length) {
      const dateRegion = regions[regionIndex];
      if (dateRegion) {
        const dateText = formatDateRange(job.startDate, job.endDate, job.isCurrentPosition);
        insertTextAtRegion(page, dateRegion, dateText, fonts, pageHeight);
        regionIndex++; // Move to next region
      }
    }

    // Insert bullets with template format
    if (job.bullets && job.bullets.length > 0) {
      job.bullets.forEach((bullet, bulletIndex) => {
        if (regionIndex >= regions.length) {
          console.warn(`  ⚠️ Not enough regions for bullet ${bulletIndex + 1} of job ${jobIndex + 1}`);
          return;
        }
        
        const bulletRegion = regions[regionIndex];
        if (!bulletRegion) {
          console.warn(`  ⚠️ No region available for bullet ${bulletIndex + 1} of job ${jobIndex + 1}`);
          return;
        }
        
        // Use bullet character from template format or original template
        let bulletChar = experienceFormat.bulletCharacter || '•';
        
        // Fallback: detect from original template text
        if (bulletChar === '•' && bulletRegion.isBullet && bulletRegion.text) {
          const match = bulletRegion.text.match(/^([●•\-*])/);
          if (match) bulletChar = match[1];
        }
        
        const bulletText = bullet.trim().match(/^[●•\-*]\s/) 
          ? bullet.trim() 
          : `${bulletChar} ${bullet.trim()}`;
        insertTextAtRegion(page, bulletRegion, bulletText, fonts, pageHeight);
        regionIndex++; // Move to next region
      });
    }
  });
}

/**
 * Insert skills
 */
function insertSkills(page, regions, skills, fonts, pageHeight) {
  if (!regions || regions.length === 0 || !skills || skills.length === 0) return;

  // Combine skills into comma-separated or bullet list
  const skillsText = Array.isArray(skills) 
    ? skills.map(s => typeof s === 'string' ? s : s.name).join(', ')
    : '';

  if (regions[0] && skillsText) {
    insertTextAtRegion(page, regions[0], skillsText, fonts, pageHeight, { wrap: true });
  }
}

/**
 * Insert education entries
 */
function insertEducation(page, regions, education, fonts, pageHeight, templateFormats = {}) {
  if (!regions || regions.length === 0 || !education || education.length === 0) return;

  const educationFormat = templateFormats.educationFormat || {};
  let regionIndex = 0;
  
  education.forEach((edu, eduIndex) => {
    if (regionIndex >= regions.length) {
      console.warn(`  ⚠️ Not enough regions for education entry ${eduIndex + 1}, skipping remaining entries`);
      return;
    }

    // Skip to next region that's on a different line (to avoid overlapping)
    const currentY = regions[regionIndex]?.bbox?.bottom || regions[regionIndex]?.bbox?.y;
    while (regionIndex < regions.length) {
      const regionY = regions[regionIndex]?.bbox?.bottom || regions[regionIndex]?.bbox?.y;
      if (Math.abs(regionY - currentY) > 2) {
        break;
      }
      regionIndex++;
    }

    if (regionIndex >= regions.length) {
      console.warn(`  ⚠️ No more regions available for education entry ${eduIndex + 1}`);
      return;
    }

    // Use template format to determine field order
    const order = educationFormat.order || ['degree', 'institution', 'dates', 'location', 'gpa'];
    
    order.forEach(field => {
      if (regionIndex >= regions.length) return;
      
      const region = regions[regionIndex];
      let textToInsert = '';

      switch (field) {
        case 'degree':
          textToInsert = edu.degree || '';
          break;
        case 'institution':
          textToInsert = edu.institution || '';
          if (educationFormat.locationAfterInstitution && edu.location) {
            textToInsert += ` - ${edu.location}`;
          }
          break;
        case 'location':
          if (!educationFormat.locationAfterInstitution) {
            textToInsert = edu.location || '';
          }
          break;
        case 'dates':
          textToInsert = formatDateRange(edu.startDate, edu.endDate, edu.isCurrent) || '';
          break;
        case 'gpa':
          textToInsert = edu.gpa && !edu.gpaPrivate ? `GPA: ${edu.gpa}` : '';
          break;
        default:
          break;
      }

      if (textToInsert && region) {
        insertTextAtRegion(page, region, textToInsert, fonts, pageHeight);
        regionIndex++;
      }
    });
    
    // Legacy format handling (if educationFormat not available)
    if (!educationFormat.order && edu.degree) {
      // Format education entry
      const parts = [];
      if (edu.degree) parts.push(edu.degree);
      if (edu.institution) parts.push(edu.institution);
      
      const eduText = parts.join(', ');
      if (eduText && regions[regionIndex]) {
        insertTextAtRegion(page, regions[regionIndex], eduText, fonts, pageHeight);
        regionIndex++;
      }

      // Dates and GPA
      if (edu.startDate && regions[regionIndex]) {
        const dateText = formatDateRange(edu.startDate, edu.endDate, false);
        if (edu.gpa && !edu.gpaPrivate) {
          insertTextAtRegion(page, regions[regionIndex], `${dateText} • GPA: ${edu.gpa}`, fonts, pageHeight);
        } else {
          insertTextAtRegion(page, regions[regionIndex], dateText, fonts, pageHeight);
        }
        regionIndex++;
      }
    }
  });
}

/**
 * Insert projects - respect template format (title | tech on same line, then bullets)
 */
function insertProjects(page, regions, projects, fonts, pageHeight, templateFormats = {}) {
  if (!regions || regions.length === 0 || !projects || projects.length === 0) return;

  let regionIndex = 0;
  projects.forEach((project, projectIndex) => {
    if (regionIndex >= regions.length) {
      console.warn(`  ⚠️ Not enough regions for project ${projectIndex + 1}, skipping remaining projects`);
      return;
    }

    // Skip to next region that's on a different line (to avoid overlapping)
    const currentY = regions[regionIndex]?.bbox?.bottom || regions[regionIndex]?.bbox?.y;
    while (regionIndex < regions.length) {
      const regionY = regions[regionIndex]?.bbox?.bottom || regions[regionIndex]?.bbox?.y;
      if (Math.abs(regionY - currentY) > 2) {
        break;
      }
      regionIndex++;
    }

    if (regionIndex >= regions.length) {
      console.warn(`  ⚠️ No more regions available for project ${projectIndex + 1}`);
      return;
    }

    const projectName = project.name || 'Untitled Project';
    const technologies = project.technologies || project.tech || [];
    const techString = Array.isArray(technologies) ? technologies.join(', ') : technologies;
    
    // Use template format if detected, otherwise detect from original text regions
    const firstRegion = regions[regionIndex];
    if (firstRegion && techString) {
      // Priority: Use detected template format > Detect from original text > Default
      const projectFormat = templateFormats.projectFormat || {};
      const usePipeFormat = projectFormat.titleWithTech !== undefined 
        ? projectFormat.titleWithTech 
        : (firstRegion.text?.includes('|') || false);
      
      if (usePipeFormat && techString) {
        // Template format: "Project Name | Tech1, Tech2, Tech3" on one line
        const combinedText = `${projectName} | ${techString}`;
        insertTextAtRegion(page, firstRegion, combinedText, fonts, pageHeight);
        regionIndex++;
      } else if (techString) {
        // Format: Title on first line, tech on second line (separate)
        insertTextAtRegion(page, firstRegion, projectName, fonts, pageHeight);
        regionIndex++;
        
        if (regionIndex < regions.length && !regions[regionIndex]?.text?.match(/^[●•\-]/)) {
          insertTextAtRegion(page, regions[regionIndex], techString, fonts, pageHeight);
          regionIndex++;
        }
      } else {
        // No tech, just title
        insertTextAtRegion(page, firstRegion, projectName, fonts, pageHeight);
        regionIndex++;
      }
    } else if (firstRegion) {
      // No technologies, just name
      insertTextAtRegion(page, firstRegion, projectName, fonts, pageHeight);
      regionIndex++;
    }

    // Insert bullet points (from bullets array or description)
    const bullets = project.bullets || 
                   (project.description ? [project.description] : []);
    
    bullets.forEach((bullet, bulletIndex) => {
      if (regionIndex >= regions.length) {
        console.warn(`  ⚠️ Not enough regions for bullet ${bulletIndex + 1} of project ${projectIndex + 1}`);
        return;
      }
      
      // Use the bullet character from template format or original region
      const bulletRegion = regions[regionIndex];
      if (!bulletRegion) {
        console.warn(`  ⚠️ No region available for bullet ${bulletIndex + 1} of project ${projectIndex + 1}`);
        return;
      }
      
      const projectFormat = templateFormats.projectFormat || {};
      let bulletChar = projectFormat.bulletCharacter || '•'; // Use template format first
      
      // Fallback: detect from original template text if format not available
      if (bulletChar === '•' && bulletRegion.isBullet && bulletRegion.text) {
        const match = bulletRegion.text.match(/^([●•\-*])/);
        if (match) {
          bulletChar = match[1];
        }
      }
      
      // Ensure bullet starts with bullet point character
      let bulletText = bullet.trim();
      if (!bulletText.match(/^[●•\-*]\s/)) {
        bulletText = `${bulletChar} ${bulletText}`;
      }
      
      // Preserve original spacing/indentation from template
      insertTextAtRegion(page, bulletRegion, bulletText, fonts, pageHeight, { wrap: true });
      regionIndex++; // Move to next region
    });
  });
}

/**
 * Sanitize text for PDF insertion - replace Unicode characters that standard fonts can't encode
 * Standard PDF fonts (WinAnsi) don't support many Unicode characters, so we replace them with ASCII
 */
function sanitizeTextForPdf(text) {
  if (!text) return text;
  
  let sanitized = text.toString();
  
  // Replace Unicode bullets with ASCII-safe alternatives
  // Standard PDF fonts use WinAnsi encoding which doesn't support:
  // ● (U+25CF Black Circle) or • (U+2022 Bullet)
  sanitized = sanitized.replace(/●/g, '-'); // Replace filled circle with hyphen (ASCII-safe)
  sanitized = sanitized.replace(/•/g, '-'); // Replace bullet with hyphen (ASCII-safe)
  sanitized = sanitized.replace(/–/g, '-'); // Replace en-dash (U+2013) with hyphen
  sanitized = sanitized.replace(/—/g, '-'); // Replace em-dash (U+2014) with hyphen
  sanitized = sanitized.replace(/"/g, '"'); // Replace left double quotation mark with straight quote
  sanitized = sanitized.replace(/"/g, '"'); // Replace right double quotation mark with straight quote
  sanitized = sanitized.replace(/'/g, "'"); // Replace left single quotation mark with apostrophe
  sanitized = sanitized.replace(/'/g, "'"); // Replace right single quotation mark with apostrophe
  
  return sanitized;
}

/**
 * Insert text at a specific region with exact positioning
 * Handles text overflow by truncating or scaling
 */
function insertTextAtRegion(page, region, text, fonts, pageHeight, options = {}) {
  const { wrap = false, maxLines = 3 } = options;
  
  if (!text || !region) return;
  
  // Sanitize text to remove Unicode characters that standard fonts can't encode
  text = sanitizeTextForPdf(text);

  // Get font for this region - use exact font name from region
  const fontName = region.font?.name || 'Helvetica';
  
  // Try exact match first
  let font = fonts[fontName];
  
  // If not found, try to find a font with similar characteristics
  if (!font) {
    const fontKeys = Object.keys(fonts).filter(k => k !== '_fontInfoMap');
    // Try exact case-insensitive match
    const matchingKey = fontKeys.find(key => 
      key.toLowerCase() === fontName.toLowerCase()
    );
    if (matchingKey) {
      font = fonts[matchingKey];
    } else {
      // Try partial match
      const partialMatch = fontKeys.find(key => 
        key.toLowerCase().includes(fontName.toLowerCase()) ||
        fontName.toLowerCase().includes(key.toLowerCase())
      );
      font = partialMatch ? fonts[partialMatch] : null;
    }
  }
  
  // Fallback to any available font or default
  if (!font) {
    const fontKeys = Object.keys(fonts).filter(k => k !== '_fontInfoMap');
    font = fonts['Helvetica'] || fonts['helvetica'] || (fontKeys.length > 0 ? fonts[fontKeys[0]] : null);
    if (!font) {
      console.warn(`⚠️ No font available for region with font name: ${fontName}`);
      return;
    }
    console.log(`  ⚠️ Font "${fontName}" not found, using fallback font`);
  }

  // Get font size from region - use EXACT size from the template
  // This is critical for preserving the original layout
  let fontSize = region.font?.size;
  if (!fontSize || fontSize === 0) {
    // Fallback to bbox height if font size not available
    fontSize = region.bbox?.height || 12;
  }
  
  // Ensure fontSize is a valid number
  if (isNaN(fontSize) || fontSize <= 0) {
    fontSize = 12; // Last resort default
  }
  
  // Log font usage for debugging (first few only)
  if (!insertTextAtRegion._fontLogged) {
    insertTextAtRegion._fontLogged = new Set();
  }
  if (!insertTextAtRegion._fontLogged.has(fontName) && insertTextAtRegion._fontLogged.size < 5) {
    console.log(`  🔤 Using font "${fontName}" at size ${fontSize}px for text: "${text?.substring(0, 30)}"`);
    insertTextAtRegion._fontLogged.add(fontName);
  }
  
  // Calculate position - bbox.y is stored as PDF coordinate (baseline)
  const bbox = region.bbox || {};
  const x = bbox.x || bbox.left || region.transform?.[4] || 0;
  
  // Use the baseline coordinate directly (bbox.bottom or bbox.y is the baseline in PDF coords)
  // In PDF coordinates (bottom-left origin): yPdf from transform[5] is the baseline
  // We stored bbox.bottom as yPdf (the baseline in PDF coordinates)
  let baselineY;
  if (bbox.bottom !== undefined) {
    baselineY = bbox.bottom; // This is the baseline in PDF coords (bottom-left origin)
  } else if (bbox.y !== undefined) {
    baselineY = bbox.y; // Fallback to y if bottom not available
  } else if (region.transform && region.transform[5] !== undefined) {
    baselineY = region.transform[5]; // Use transform[5] directly (PDF coordinate)
  } else {
    // Last resort: try to calculate from screen coordinates
    baselineY = pageHeight - (bbox.screenBottom || 0);
    console.warn(`⚠️ Using fallback Y calculation for region: ${region.text?.substring(0, 30)}`);
  }
  
  // Debug log for first few regions to verify coordinates
  if (!insertTextAtRegion._loggedCount) insertTextAtRegion._loggedCount = 0;
  if (insertTextAtRegion._loggedCount < 5) {
    console.log(`  📍 Text region ${insertTextAtRegion._loggedCount}: "${text?.substring(0, 30)}" at (${x}, ${baselineY}), fontSize=${fontSize}, bbox.bottom=${bbox.bottom}, bbox.y=${bbox.y}`);
    insertTextAtRegion._loggedCount++;
  }
  
  // Get bounding box dimensions
  const bboxWidth = bbox.width || (bbox.right - bbox.left) || 400;
  const bboxHeight = bbox.height || (bbox.top - bbox.bottom) || fontSize * 1.2;

  // Parse color
  const color = parseColor(region.color || '#000000');

  // Handle text overflow
  // Sanitize text immediately to remove Unicode characters that standard fonts can't encode
  let displayText = sanitizeTextForPdf(text);
  let finalFontSize = fontSize;
  
  // Ensure coordinates are valid
  if (isNaN(x) || isNaN(baselineY) || isNaN(finalFontSize)) {
    console.warn(`⚠️ Invalid coordinates for text insertion: x=${x}, y=${baselineY}, fontSize=${finalFontSize}, text="${displayText?.substring(0, 30)}"`);
    return;
  }
  
  if (wrap) {
    // Wrap text to fit bounding box
    const lines = wrapTextToWidth(displayText, font, fontSize, bboxWidth);
    displayText = lines.slice(0, maxLines).join('\n');
    
    // If text was truncated, add ellipsis to last line
    if (lines.length > maxLines) {
      const lastLine = displayText.split('\n').pop();
      displayText = displayText.slice(0, -lastLine.length) + lastLine.slice(0, -3) + '...';
    }
    
    // Draw multi-line text - adjust y position for first line baseline
    // First line baseline should be at baselineY, subsequent lines go up
    // Use exact font size and line height from template
    const lineHeight = region.font?.lineHeight || (fontSize * 1.2); // Preserve line height if available
    page.drawText(displayText, {
      x,
      y: baselineY, // Use baseline position
      size: fontSize, // Use exact font size from template region
      font,
      color,
      maxWidth: bboxWidth,
      lineHeight: lineHeight
    });
  } else {
    // Single line - truncate or scale to fit
    // Use exact font size from template
    const textWidth = font.widthOfTextAtSize(displayText, fontSize);
    
    if (textWidth > bboxWidth) {
      // Truncate text to fit
      let truncated = displayText;
      while (font.widthOfTextAtSize(truncated + '...', fontSize) > bboxWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
      }
      displayText = truncated + '...';
    }
    
    // Draw text at exact baseline position with EXACT font size from template
    page.drawText(displayText, {
      x,
      y: baselineY, // Use baseline position for precise alignment
      size: fontSize, // Use exact font size from template region (not finalFontSize)
      font,
      color,
      maxWidth: bboxWidth
    });
  }
}

/**
 * Wrap text to fit within a width
 */
function wrapTextToWidth(text, font, fontSize, width) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    if (testWidth > width && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Format date range
 */
function formatDateRange(startDate, endDate, isCurrent) {
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const start = formatDate(startDate);
  const end = isCurrent ? 'Present' : formatDate(endDate);
  
  return start && end ? `${start} - ${end}` : start || end || '';
}

/**
 * UC-51: Add watermark to all pages of a PDF
 * @param {PDFDocument} pdfDoc - The PDF document
 * @param {string} text - Watermark text
 */
async function addWatermarkToPdf(pdfDoc, text) {
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  for (const page of pages) {
    const { width, height } = page.getSize();
    const fontSize = 60;
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = fontSize;
    
    // Calculate position for diagonal watermark (center of page)
    const x = (width - textWidth) / 2;
    const y = (height - textHeight) / 2;
    
    // Draw watermark with transparency and rotation
    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.7, 0.7, 0.7),
      opacity: 0.3,
      rotate: degrees(-45),
    });
  }
}

