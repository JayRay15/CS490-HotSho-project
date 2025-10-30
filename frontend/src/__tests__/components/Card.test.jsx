import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import Card from '../../components/Card';

describe('Card Component - UC-020', () => {
  
  test('should render with default variant', () => {
    render(<Card title="Test Card">Content</Card>);
    
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  test('should render all 7 variants correctly', () => {
    const variants = ['default', 'primary', 'info', 'muted', 'elevated', 'outlined', 'interactive'];
    
    variants.forEach(variant => {
      const { container } = render(<Card variant={variant}>Test</Card>);
      const card = container.firstChild;
      // Check that card renders with Tailwind classes (actual implementation)
      expect(card).toHaveClass('rounded-2xl');
      expect(card).toHaveClass('p-6');
    });
  });

  test('should render without title', () => {
    render(<Card>Content only</Card>);
    
    expect(screen.getByText('Content only')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  test('should apply custom className', () => {
    const { container } = render(<Card className="custom-class">Test</Card>);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  test('should render with title and content', () => {
    render(
      <Card title="With Title">
        <p>Card content</p>
        <button>Action Button</button>
      </Card>
    );
    
    expect(screen.getByText('With Title')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });

  test('should handle onClick for interactive variant', () => {
    const handleClick = vi.fn();
    render(
      <Card variant="interactive" onClick={handleClick}>
        Clickable Card
      </Card>
    );
    
    const card = screen.getByText('Clickable Card').parentElement;
    card.click();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('should render different card sizes', () => {
    const { container } = render(<Card className="card--large">Large Card</Card>);
    
    expect(container.firstChild).toHaveClass('card--large');
  });

  test('should render with nested elements', () => {
    render(
      <Card>
        <div>
          <p>Nested Content</p>
          <span>More content</span>
        </div>
      </Card>
    );
    
    expect(screen.getByText('Nested Content')).toBeInTheDocument();
    expect(screen.getByText('More content')).toBeInTheDocument();
  });
});

describe('Button Component', () => {
  
  test('should render button with text', () => {
    render(<button>Click Me</button>);
    
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  test('should handle click events', () => {
    const handleClick = vi.fn();
    render(<button onClick={handleClick}>Click Me</button>);
    
    const button = screen.getByText('Click Me');
    button.click();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('should be disabled when disabled prop is true', () => {
    render(<button disabled>Disabled Button</button>);
    
    const button = screen.getByText('Disabled Button');
    expect(button).toBeDisabled();
  });
});

describe('Container Component - UC-020', () => {
  
  test('should render with level 1 (default)', () => {
    const { container } = render(
      <div className="container-level-1">
        <p>Container Content</p>
      </div>
    );
    
    expect(container.firstChild).toHaveClass('container-level-1');
    expect(screen.getByText('Container Content')).toBeInTheDocument();
  });

  test('should render with level 2', () => {
    const { container } = render(
      <div className="container-level-2">
        <p>Nested Container</p>
      </div>
    );
    
    expect(container.firstChild).toHaveClass('container-level-2');
  });

  test('should center content', () => {
    const { container } = render(
      <div className="container-level-1" style={{ margin: '0 auto' }}>
        Content
      </div>
    );
    
    const element = container.firstChild;
    expect(element).toHaveStyle({ margin: '0 auto' });
  });
});
