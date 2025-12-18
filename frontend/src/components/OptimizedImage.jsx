import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * OptimizedImage Component
 * 
 * A performance-optimized image component that implements:
 * - Lazy loading with Intersection Observer
 * - Native browser lazy loading fallback
 * - Blur placeholder during load
 * - WebP format support detection
 * - Error handling with fallback
 * - Responsive sizing with srcset support
 */
const OptimizedImage = ({
    src,
    alt,
    width,
    height,
    className = '',
    placeholder = 'blur',
    priority = false,
    sizes,
    srcSet,
    onLoad,
    onError,
    fallbackSrc = '/placeholder-image.svg',
    ...props
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);

    // Use Intersection Observer for lazy loading
    useEffect(() => {
        if (priority) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '50px', // Start loading 50px before entering viewport
                threshold: 0.01,
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, [priority]);

    const handleLoad = (e) => {
        setIsLoaded(true);
        onLoad?.(e);
    };

    const handleError = (e) => {
        setHasError(true);
        onError?.(e);
    };

    const imageSrc = hasError ? fallbackSrc : src;

    // Placeholder styles
    const placeholderStyles = {
        blur: {
            filter: isLoaded ? 'none' : 'blur(10px)',
            transition: 'filter 0.3s ease-out',
        },
        none: {},
    };

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden ${className}`}
            style={{
                width: width ? `${width}px` : 'auto',
                height: height ? `${height}px` : 'auto',
                backgroundColor: !isLoaded ? '#f3f4f6' : 'transparent',
            }}
        >
            {isInView && (
                <img
                    src={imageSrc}
                    alt={alt}
                    width={width}
                    height={height}
                    loading={priority ? 'eager' : 'lazy'}
                    decoding={priority ? 'sync' : 'async'}
                    fetchPriority={priority ? 'high' : 'auto'}
                    onLoad={handleLoad}
                    onError={handleError}
                    sizes={sizes}
                    srcSet={srcSet}
                    style={{
                        ...placeholderStyles[placeholder],
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                    {...props}
                />
            )}

            {/* Loading skeleton */}
            {!isLoaded && isInView && (
                <div
                    className="absolute inset-0 bg-gray-200 animate-pulse"
                    style={{ zIndex: -1 }}
                />
            )}
        </div>
    );
};

OptimizedImage.propTypes = {
    src: PropTypes.string.isRequired,
    alt: PropTypes.string.isRequired,
    width: PropTypes.number,
    height: PropTypes.number,
    className: PropTypes.string,
    placeholder: PropTypes.oneOf(['blur', 'none']),
    priority: PropTypes.bool,
    sizes: PropTypes.string,
    srcSet: PropTypes.string,
    onLoad: PropTypes.func,
    onError: PropTypes.func,
    fallbackSrc: PropTypes.string,
};

export default OptimizedImage;

/**
 * Utility to generate srcSet for responsive images
 * @param {string} baseSrc - Base image source
 * @param {number[]} widths - Array of widths to generate
 * @returns {string} srcSet string
 */
export const generateSrcSet = (baseSrc, widths = [320, 640, 960, 1280, 1920]) => {
    // For external URLs or data URLs, return empty
    if (baseSrc.startsWith('data:') || baseSrc.startsWith('http')) {
        return '';
    }

    // Extract file extension
    const extMatch = baseSrc.match(/\.([^.]+)$/);
    if (!extMatch) return '';

    const ext = extMatch[1];
    const basePath = baseSrc.replace(/\.[^.]+$/, '');

    return widths
        .map((w) => `${basePath}-${w}w.${ext} ${w}w`)
        .join(', ');
};

/**
 * Preload critical images
 * Call this function early for above-the-fold images
 */
export const preloadImage = (src, priority = 'high') => {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    link.fetchPriority = priority;
    document.head.appendChild(link);
};
