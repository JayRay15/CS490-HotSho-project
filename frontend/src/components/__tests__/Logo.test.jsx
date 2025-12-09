import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import Logo from '../Logo.jsx';

describe('Logo - Comprehensive Tests', () => {
  describe('Default Rendering', () => {
    test('renders with default props', () => {
      render(<Logo />);
      
      const logo = screen.getByRole('img', { name: /nirvana/i });
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('alt', 'Nirvana ATS Logo');
    });

    test('has correct default classes', () => {
      render(<Logo />);
      
      const logo = screen.getByRole('img');
      expect(logo.className).toContain('logo');
      expect(logo.className).toContain('logo-full');
    });

    test('has correct aria-label', () => {
      render(<Logo />);
      
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('aria-label', 'Nirvana Application Tracking System Logo');
    });

    test('has eager loading attribute', () => {
      render(<Logo />);
      
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('loading', 'eager');
    });
  });

  describe('Variant Types', () => {
    test('renders full variant', () => {
      render(<Logo variant="full" />);
      
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('src');
      expect(logo.getAttribute('src')).toBeTruthy();
      expect(logo.className).toContain('logo-full');
    });

    test('renders icon variant', () => {
      render(<Logo variant="icon" />);
      
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('src');
      expect(logo.getAttribute('src')).toBeTruthy();
      expect(logo.className).toContain('logo-icon');
    });

    test('renders text variant', () => {
      render(<Logo variant="text" />);
      
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('src');
      expect(logo.getAttribute('src')).toBeTruthy();
      expect(logo.className).toContain('logo-text');
    });

    test('renders white variant', () => {
      render(<Logo variant="white" />);
      
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('src');
      expect(logo.getAttribute('src')).toBeTruthy();
      expect(logo.className).toContain('logo-white');
    });

    test('falls back to full variant for unknown variant', () => {
      render(<Logo variant="unknown" />);
      
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('src');
      expect(logo.getAttribute('src')).toBeTruthy();
    });
  });

  describe('Size Variants', () => {
    test('renders small size', () => {
      render(<Logo size="sm" />);
      
      const logo = screen.getByRole('img');
      expect(logo.style.width).toBe('160px');
      expect(logo.style.height).toBe('40px');
    });

    test('renders medium size (default)', () => {
      render(<Logo size="md" />);
      
      const logo = screen.getByRole('img');
      expect(logo.style.width).toBe('220px');
      expect(logo.style.height).toBe('55px');
    });

    test('renders large size', () => {
      render(<Logo size="lg" />);
      
      const logo = screen.getByRole('img');
      expect(logo.style.width).toBe('280px');
      expect(logo.style.height).toBe('70px');
    });

    test('renders xl size', () => {
      render(<Logo size="xl" />);
      
      const logo = screen.getByRole('img');
      expect(logo.style.width).toBe('360px');
      expect(logo.style.height).toBe('90px');
    });
  });

  describe('Icon Variant Sizes', () => {
    test('icon variant with small size', () => {
      render(<Logo variant="icon" size="sm" />);
      
      const logo = screen.getByRole('img');
      expect(logo.style.width).toBe('32px');
      expect(logo.style.height).toBe('32px');
    });

    test('icon variant with medium size', () => {
      render(<Logo variant="icon" size="md" />);
      
      const logo = screen.getByRole('img');
      expect(logo.style.width).toBe('48px');
      expect(logo.style.height).toBe('48px');
    });

    test('icon variant with large size', () => {
      render(<Logo variant="icon" size="lg" />);
      
      const logo = screen.getByRole('img');
      expect(logo.style.width).toBe('64px');
      expect(logo.style.height).toBe('64px');
    });

    test('icon variant with xl size', () => {
      render(<Logo variant="icon" size="xl" />);
      
      const logo = screen.getByRole('img');
      expect(logo.style.width).toBe('80px');
      expect(logo.style.height).toBe('80px');
    });
  });

  describe('Custom Size', () => {
    test('uses custom width and height', () => {
      render(<Logo size="custom" customWidth="200px" customHeight="100px" />);
      
      const logo = screen.getByRole('img');
      expect(logo.style.width).toBe('200px');
      expect(logo.style.height).toBe('100px');
    });

    test('falls back to defaults when custom size has no values', () => {
      render(<Logo size="custom" />);
      
      const logo = screen.getByRole('img');
      expect(logo.style.width).toBe('220px');
      expect(logo.style.height).toBe('55px');
    });

    test('icon variant uses icon defaults for custom size', () => {
      render(<Logo variant="icon" size="custom" />);
      
      const logo = screen.getByRole('img');
      expect(logo.style.width).toBe('48px');
      expect(logo.style.height).toBe('48px');
    });

    test('icon variant uses custom dimensions when provided', () => {
      render(<Logo variant="icon" size="custom" customWidth="100px" customHeight="100px" />);
      
      const logo = screen.getByRole('img');
      expect(logo.style.width).toBe('100px');
      expect(logo.style.height).toBe('100px');
    });
  });

  describe('Custom ClassName', () => {
    test('applies additional className', () => {
      render(<Logo className="my-custom-class" />);
      
      const logo = screen.getByRole('img');
      expect(logo.className).toContain('my-custom-class');
    });

    test('preserves default classes with additional className', () => {
      render(<Logo className="extra-class" />);
      
      const logo = screen.getByRole('img');
      expect(logo.className).toContain('logo');
      expect(logo.className).toContain('logo-full');
      expect(logo.className).toContain('extra-class');
    });
  });

  describe('Object Fit', () => {
    test('has contain object-fit', () => {
      render(<Logo />);
      
      const logo = screen.getByRole('img');
      expect(logo.style.objectFit).toBe('contain');
    });
  });

  describe('Combined Props', () => {
    test('renders with all custom props', () => {
      render(
        <Logo 
          variant="white" 
          size="lg" 
          className="navbar-logo" 
        />
      );
      
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('src');
      expect(logo.getAttribute('src')).toBeTruthy();
      expect(logo.style.width).toBe('280px');
      expect(logo.style.height).toBe('70px');
      expect(logo.className).toContain('navbar-logo');
      expect(logo.className).toContain('logo-white');
    });

    test('icon variant with custom size and className', () => {
      render(
        <Logo 
          variant="icon" 
          size="custom" 
          customWidth="120px" 
          customHeight="120px"
          className="avatar-logo" 
        />
      );
      
      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('src');
      expect(logo.getAttribute('src')).toBeTruthy();
      expect(logo.style.width).toBe('120px');
      expect(logo.style.height).toBe('120px');
      expect(logo.className).toContain('avatar-logo');
    });
  });
});
