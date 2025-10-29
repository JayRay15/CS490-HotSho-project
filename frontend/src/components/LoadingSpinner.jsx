import PropTypes from 'prop-types';
import Logo from './Logo';
import Icon from './Icon';

/**
 * LoadingSpinner - Branded loading indicator with Nirvana logo
 * 
 * @param {string} size - Spinner size: 'sm', 'md', 'lg'
 * @param {string} text - Optional loading text
 * @param {boolean} fullScreen - Show as full-screen overlay
 * @param {string} variant - 'spinner' (animated circles) or 'logo' (pulsing logo)
 */
const LoadingSpinner = ({
  size = 'md',
  text = 'Loading...',
  fullScreen = false,
  variant = 'spinner'
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const logoSizeMap = {
    sm: 'sm',
    md: 'md',
    lg: 'lg'
  };

  const spinnerContent = variant === 'logo' ? (
    <div className="animate-pulse">
      <Logo variant="icon" size={logoSizeMap[size]} />
    </div>
  ) : (
    // use lucide Loader icon for crisp scalable spinner, fall back to CSS rings
    <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
      {Icon ? (
        <Icon name="Loader" className={`text-blue-600`} size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'} />
      ) : (
        <>
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          {/* Spinning ring */}
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
          {/* Inner accent ring */}
          <div className="absolute inset-2 border-2 border-transparent border-t-accent rounded-full animate-spin"
            style={{ animationDuration: '0.8s', animationDirection: 'reverse' }}></div>
        </>
      )}
    </div>
  );

  const content = (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      {spinnerContent}
      {text && (
        <p className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
          {text}
        </p>
      )}
      <span className="sr-only">Loading content, please wait</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  text: PropTypes.string,
  fullScreen: PropTypes.bool,
  variant: PropTypes.oneOf(['spinner', 'logo'])
};

export default LoadingSpinner;
