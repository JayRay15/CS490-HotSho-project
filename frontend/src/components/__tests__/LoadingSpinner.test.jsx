import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import LoadingSpinner from '../LoadingSpinner.jsx';

// Mock Logo component
vi.mock('../Logo', () => ({
  default: function MockLogo({ variant, size }) {
    return <div data-testid="mock-logo" data-variant={variant} data-size={size}>Logo</div>;
  },
}));

describe('LoadingSpinner - Comprehensive Tests', () => {
  describe('Default Rendering', () => {
    test('renders with default props', () => {
      render(<LoadingSpinner />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('has correct aria attributes', () => {
      render(<LoadingSpinner />);
      
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    test('includes screen reader text', () => {
      render(<LoadingSpinner />);
      
      expect(screen.getByText('Loading content, please wait')).toHaveClass('sr-only');
    });
  });

  describe('Size Variants', () => {
    test('renders small size correctly', () => {
      const { container } = render(<LoadingSpinner size="sm" />);
      
      const spinner = container.querySelector('.w-6.h-6');
      expect(spinner).toBeInTheDocument();
      expect(screen.getByText('Loading...').className).toContain('text-sm');
    });

    test('renders medium size correctly', () => {
      const { container } = render(<LoadingSpinner size="md" />);
      
      const spinner = container.querySelector('.w-12.h-12');
      expect(spinner).toBeInTheDocument();
      expect(screen.getByText('Loading...').className).toContain('text-base');
    });

    test('renders large size correctly', () => {
      const { container } = render(<LoadingSpinner size="lg" />);
      
      const spinner = container.querySelector('.w-16.h-16');
      expect(spinner).toBeInTheDocument();
      expect(screen.getByText('Loading...').className).toContain('text-lg');
    });
  });

  describe('Custom Text', () => {
    test('displays custom loading text', () => {
      render(<LoadingSpinner text="Please wait..." />);
      
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    test('renders without text when text is empty string', () => {
      render(<LoadingSpinner text="" />);
      
      // Empty string is falsy, so text paragraph should not render
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    test('renders without text when text is null', () => {
      render(<LoadingSpinner text={null} />);
      
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('Variant Types', () => {
    test('renders spinner variant by default', () => {
      const { container } = render(<LoadingSpinner variant="spinner" />);
      
      // Spinner should have animated rings
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
      expect(container.querySelector('.border-t-blue-600')).toBeInTheDocument();
    });

    test('renders logo variant with pulsing animation', () => {
      const { container } = render(<LoadingSpinner variant="logo" />);
      
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
      expect(screen.getByTestId('mock-logo')).toBeInTheDocument();
    });

    test('logo variant passes correct props to Logo component', () => {
      render(<LoadingSpinner variant="logo" size="lg" />);
      
      const logo = screen.getByTestId('mock-logo');
      expect(logo).toHaveAttribute('data-variant', 'icon');
      expect(logo).toHaveAttribute('data-size', 'lg');
    });

    test('logo variant with small size', () => {
      render(<LoadingSpinner variant="logo" size="sm" />);
      
      const logo = screen.getByTestId('mock-logo');
      expect(logo).toHaveAttribute('data-size', 'sm');
    });

    test('logo variant with medium size', () => {
      render(<LoadingSpinner variant="logo" size="md" />);
      
      const logo = screen.getByTestId('mock-logo');
      expect(logo).toHaveAttribute('data-size', 'md');
    });
  });

  describe('Full Screen Mode', () => {
    test('renders as full screen overlay when fullScreen is true', () => {
      const { container } = render(<LoadingSpinner fullScreen={true} />);
      
      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
      expect(overlay.className).toContain('bg-white');
      expect(overlay.className).toContain('bg-opacity-90');
      expect(overlay.className).toContain('z-50');
    });

    test('includes backdrop blur in full screen mode', () => {
      const { container } = render(<LoadingSpinner fullScreen={true} />);
      
      const overlay = container.querySelector('.fixed');
      expect(overlay.className).toContain('backdrop-blur-sm');
    });

    test('centers content in full screen mode', () => {
      const { container } = render(<LoadingSpinner fullScreen={true} />);
      
      const overlay = container.querySelector('.fixed');
      expect(overlay.className).toContain('flex');
      expect(overlay.className).toContain('items-center');
      expect(overlay.className).toContain('justify-center');
    });

    test('does not render overlay when fullScreen is false', () => {
      const { container } = render(<LoadingSpinner fullScreen={false} />);
      
      expect(container.querySelector('.fixed')).not.toBeInTheDocument();
    });
  });

  describe('Spinner Animation Elements', () => {
    test('has outer ring', () => {
      const { container } = render(<LoadingSpinner />);
      
      const outerRing = container.querySelector('.border-blue-200');
      expect(outerRing).toBeInTheDocument();
      expect(outerRing.className).toContain('border-4');
      expect(outerRing.className).toContain('rounded-full');
    });

    test('has spinning ring with border-t-blue-600', () => {
      const { container } = render(<LoadingSpinner />);
      
      const spinningRing = container.querySelector('.border-t-blue-600');
      expect(spinningRing).toBeInTheDocument();
      expect(spinningRing.className).toContain('animate-spin');
    });

    test('has inner accent ring with reverse animation', () => {
      const { container } = render(<LoadingSpinner />);
      
      const innerRing = container.querySelector('.inset-2');
      expect(innerRing).toBeInTheDocument();
      expect(innerRing.className).toContain('animate-spin');
      expect(innerRing.style.animationDirection).toBe('reverse');
    });
  });

  describe('Content Structure', () => {
    test('has flex column layout for content', () => {
      const { container } = render(<LoadingSpinner />);
      
      const contentWrapper = container.querySelector('.flex.flex-col');
      expect(contentWrapper).toBeInTheDocument();
      expect(contentWrapper.className).toContain('items-center');
      expect(contentWrapper.className).toContain('justify-center');
      expect(contentWrapper.className).toContain('gap-3');
    });

    test('text has correct styling', () => {
      render(<LoadingSpinner />);
      
      const text = screen.getByText('Loading...');
      expect(text.className).toContain('text-gray-600');
      expect(text.className).toContain('font-medium');
    });
  });

  describe('Combined Props', () => {
    test('renders full screen with logo variant and large size', () => {
      const { container } = render(
        <LoadingSpinner fullScreen={true} variant="logo" size="lg" text="Loading dashboard..." />
      );
      
      expect(container.querySelector('.fixed')).toBeInTheDocument();
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
      expect(screen.getByTestId('mock-logo')).toHaveAttribute('data-size', 'lg');
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });

    test('renders inline with spinner variant and small size', () => {
      const { container } = render(
        <LoadingSpinner fullScreen={false} variant="spinner" size="sm" text="Saving..." />
      );
      
      expect(container.querySelector('.fixed')).not.toBeInTheDocument();
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
      expect(container.querySelector('.w-6.h-6')).toBeInTheDocument();
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });
});
