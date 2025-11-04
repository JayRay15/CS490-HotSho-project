/**
 * Theme Presets for Resume Templates (UC-051)
 * Provides pre-defined color schemes and styling for different resume aesthetics
 */

export const THEME_PRESETS = {
  professional: {
    name: 'Professional',
    description: 'Classic and timeless - perfect for corporate roles',
    colors: {
      primary: '#2C3E50',      // Dark blue-gray
      secondary: '#34495E',    // Medium blue-gray
      text: '#2C3E50',         // Dark text
      muted: '#7F8C8D',        // Gray
      accent: '#3498DB',       // Blue accent
      background: '#FFFFFF',   // White
      border: '#BDC3C7'        // Light gray
    },
    fonts: {
      heading: 'Georgia, serif',
      body: 'Arial, sans-serif',
      sizes: {
        name: '32px',
        sectionHeader: '16px',
        jobTitle: '14px',
        body: '11px',
        small: '10px'
      }
    }
  },
  
  modern: {
    name: 'Modern',
    description: 'Clean and contemporary - great for tech and startups',
    colors: {
      primary: '#1A73E8',      // Google blue
      secondary: '#5F6368',    // Gray
      text: '#202124',         // Almost black
      muted: '#5F6368',        // Gray
      accent: '#34A853',       // Green accent
      background: '#FFFFFF',   // White
      border: '#DADCE0'        // Light border
    },
    fonts: {
      heading: 'Inter, sans-serif',
      body: 'Inter, sans-serif',
      sizes: {
        name: '36px',
        sectionHeader: '18px',
        jobTitle: '16px',
        body: '14px',
        small: '12px'
      }
    }
  },
  
  creative: {
    name: 'Creative',
    description: 'Bold and expressive - ideal for design and creative fields',
    colors: {
      primary: '#9C27B0',      // Purple
      secondary: '#E91E63',    // Pink
      text: '#212121',         // Dark gray
      muted: '#757575',        // Medium gray
      accent: '#FF5722',       // Orange accent
      background: '#FFFFFF',   // White
      border: '#BDBDBD'        // Gray border
    },
    fonts: {
      heading: 'Montserrat, sans-serif',
      body: 'Open Sans, sans-serif',
      sizes: {
        name: '40px',
        sectionHeader: '20px',
        jobTitle: '16px',
        body: '13px',
        small: '11px'
      }
    }
  },
  
  minimal: {
    name: 'Minimal',
    description: 'Simple and elegant - versatile for any industry',
    colors: {
      primary: '#000000',      // Black
      secondary: '#424242',    // Dark gray
      text: '#212121',         // Almost black
      muted: '#9E9E9E',        // Gray
      accent: '#616161',       // Medium gray
      background: '#FFFFFF',   // White
      border: '#E0E0E0'        // Light gray
    },
    fonts: {
      heading: 'Helvetica, Arial, sans-serif',
      body: 'Helvetica, Arial, sans-serif',
      sizes: {
        name: '34px',
        sectionHeader: '16px',
        jobTitle: '14px',
        body: '12px',
        small: '10px'
      }
    }
  },
  
  bold: {
    name: 'Bold',
    description: 'Strong and confident - stand out from the crowd',
    colors: {
      primary: '#D32F2F',      // Red
      secondary: '#C62828',    // Dark red
      text: '#212121',         // Dark gray
      muted: '#757575',        // Gray
      accent: '#FFA000',       // Amber accent
      background: '#FFFFFF',   // White
      border: '#BDBDBD'        // Gray border
    },
    fonts: {
      heading: 'Roboto Condensed, sans-serif',
      body: 'Roboto, sans-serif',
      sizes: {
        name: '38px',
        sectionHeader: '18px',
        jobTitle: '15px',
        body: '13px',
        small: '11px'
      }
    }
  },
  
  elegant: {
    name: 'Elegant',
    description: 'Sophisticated and refined - executive and senior roles',
    colors: {
      primary: '#4A5568',      // Slate gray
      secondary: '#2D3748',    // Dark slate
      text: '#1A202C',         // Almost black
      muted: '#718096',        // Light slate
      accent: '#805AD5',       // Purple accent
      background: '#FFFFFF',   // White
      border: '#CBD5E0'        // Light border
    },
    fonts: {
      heading: 'Playfair Display, serif',
      body: 'Source Sans Pro, sans-serif',
      sizes: {
        name: '36px',
        sectionHeader: '17px',
        jobTitle: '15px',
        body: '12px',
        small: '10px'
      }
    }
  }
};

/**
 * Get all theme preset names
 */
export const getThemePresetNames = () => Object.keys(THEME_PRESETS);

/**
 * Get a specific theme preset by name
 */
export const getThemePreset = (name) => THEME_PRESETS[name] || THEME_PRESETS.professional;

/**
 * Apply a theme preset to a template
 */
export const applyThemeToTemplate = (template, themeName) => {
  const theme = getThemePreset(themeName);
  return {
    ...template,
    theme: {
      ...theme,
      presetName: themeName
    }
  };
};
