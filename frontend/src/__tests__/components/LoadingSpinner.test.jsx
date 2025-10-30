import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import LoadingSpinner from '../../components/LoadingSpinner';

describe('LoadingSpinner Component Tests', () => {
  
  test('should render loading spinner', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('should render with small size', () => {
    render(<LoadingSpinner size="sm" text="Small" />);
    expect(screen.getByText('Small')).toHaveClass('text-sm');
  });

  test('should render with medium size (default)', () => {
    render(<LoadingSpinner size="md" text="Medium" />);
    expect(screen.getByText('Medium')).toHaveClass('text-base');
  });

  test('should render with large size', () => {
    render(<LoadingSpinner size="lg" text="Large" />);
    expect(screen.getByText('Large')).toHaveClass('text-lg');
  });

  test('should render with text', () => {
    render(<LoadingSpinner text="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('should render with custom text', () => {
    render(<LoadingSpinner text="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  test('should render centered by default', () => {
    const { container } = render(<LoadingSpinner />);
    const wrapper = container.querySelector('[role="status"]');
    expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
  });

  test('should render with fullscreen overlay', () => {
    const { container } = render(<LoadingSpinner fullScreen />);
    const overlay = container.firstChild;
    expect(overlay).toHaveClass('fixed', 'inset-0');
  });

  test('should render with role="status" for accessibility', () => {
    const { container } = render(<LoadingSpinner />);
    const status = container.querySelector('[role="status"]');
    expect(status).toBeInTheDocument();
  });

  test('should render with sr-only text for screen readers', () => {
    const { container } = render(<LoadingSpinner />);
    const srText = container.querySelector('.sr-only');
    expect(srText).toBeInTheDocument();
    expect(srText).toHaveTextContent('Loading content, please wait');
  });

  test('should render with default text "Loading..."', () => {
    render(<LoadingSpinner />);
    // Default text is "Loading..."
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('should render overlay with backdrop blur', () => {
    const { container } = render(<LoadingSpinner fullScreen />);
    const overlay = container.firstChild;
    expect(overlay).toHaveClass('backdrop-blur-sm');
  });

  test('should render with high z-index when fullscreen', () => {
    const { container } = render(<LoadingSpinner fullScreen />);
    const overlay = container.firstChild;
    expect(overlay).toHaveClass('z-50');
  });

  test('should render inline when not fullscreen', () => {
    const { container } = render(<LoadingSpinner />);
    const status = container.querySelector('[role="status"]');
    expect(status).not.toHaveClass('fixed');
  });

  test('should render with gap between spinner and text', () => {
    const { container } = render(<LoadingSpinner text="Loading data..." />);
    const wrapper = container.querySelector('[role="status"]');
    expect(wrapper).toHaveClass('gap-3');
  });

  test('should render with animation class', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  test('should render with aria-live for screen readers', () => {
    const { container } = render(<LoadingSpinner />);
    const status = container.querySelector('[aria-live="polite"]');
    expect(status).toBeInTheDocument();
  });

  test('should render with logo variant', () => {
    const { container } = render(<LoadingSpinner variant="logo" />);
    const pulse = container.querySelector('.animate-pulse');
    expect(pulse).toBeInTheDocument();
  });

  test('should render with spinner variant by default', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  test('should have white background when fullscreen', () => {
    const { container } = render(<LoadingSpinner fullScreen />);
    const overlay = container.firstChild;
    expect(overlay).toHaveClass('bg-white');
  });

  test('should render text with proper styling', () => {
    render(<LoadingSpinner text="Styled text" />);
    const text = screen.getByText('Styled text');
    expect(text).toHaveClass('text-gray-600');
    expect(text).toHaveClass('font-medium');
  });
});
