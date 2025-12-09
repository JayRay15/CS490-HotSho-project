import PropTypes from 'prop-types';
import logoFull from '../assets/logo-full.svg';
import logoIcon from '../assets/logo-icon.svg';
import logoText from '../assets/logo-text.svg';
import logoWhite from '../assets/logo-white.svg';

/**
 * Logo Component - Displays Nirvana branding with multiple variants
 * 
 * @param {string} variant - Logo variant: 'full', 'icon', 'text', 'white'
 * @param {string} size - Size preset: 'sm', 'md', 'lg', 'xl', 'custom'
 * @param {string} customWidth - Custom width (only used when size='custom')
 * @param {string} customHeight - Custom height (only used when size='custom')
 * @param {string} className - Additional CSS classes
 */
const Logo = ({ 
  variant = 'full', 
  size = 'md', 
  customWidth = null,
  customHeight = null,
  className = '' 
}) => {
  // Logo size configurations
  const sizes = {
    sm: { width: '160px', height: '40px' },
    md: { width: '220px', height: '55px' },
    lg: { width: '280px', height: '70px' },
    xl: { width: '360px', height: '90px' },
    custom: { width: customWidth || '220px', height: customHeight || '55px' }
  };

  // Icon-only sizes (square aspect ratio)
  const iconSizes = {
    sm: { width: '32px', height: '32px' },
    md: { width: '48px', height: '48px' },
    lg: { width: '64px', height: '64px' },
    xl: { width: '80px', height: '80px' },
    custom: { width: customWidth || '48px', height: customHeight || '48px' }
  };

  // Select appropriate logo file
  const logoSources = {
    full: logoFull,
    icon: logoIcon,
    text: logoText,
    white: logoWhite
  };

  const logoSrc = logoSources[variant] || logoSources.full;
  const dimensions = variant === 'icon' ? iconSizes[size] : sizes[size];

  return (
    <img
      src={logoSrc}
      alt="Nirvana ATS Logo"
      className={`logo logo-${variant} ${className}`}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        objectFit: 'contain'
      }}
      loading="eager"
      aria-label="Nirvana Application Tracking System Logo"
    />
  );
};

Logo.propTypes = {
  variant: PropTypes.oneOf(['full', 'icon', 'text', 'white']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'custom']),
  customWidth: PropTypes.string,
  customHeight: PropTypes.string,
  className: PropTypes.string
};

export default Logo;
