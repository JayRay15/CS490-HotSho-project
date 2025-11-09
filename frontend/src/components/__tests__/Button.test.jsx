import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button.jsx';
import LoadingSpinner from '../LoadingSpinner';

vi.mock('../LoadingSpinner', () => ({
  __esModule: true,
  default: ({ size }) => <div data-testid="spinner">spinner-{size}</div>
}));

describe('Button', () => {
  test('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('disabled prop disables the button', async () => {
    const handle = vi.fn();
    render(<Button disabled onClick={handle}>Nope</Button>);
    const btn = screen.getByText('Nope');
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(handle).not.toHaveBeenCalled();
  });

  test('isLoading shows spinner and hides text with size small', () => {
    render(<Button isLoading size="small">Load</Button>);
    // children still present but text should be transparent via class
    expect(screen.getByText('Load')).toBeInTheDocument();
    // spinner should use sm mapping
    expect(screen.getByTestId('spinner').textContent).toBe('spinner-sm');
  });

  test('isLoading shows spinner with size large and medium fallback', () => {
    const { rerender } = render(<Button isLoading size="large">L</Button>);
    expect(screen.getByTestId('spinner').textContent).toBe('spinner-lg');

    rerender(<Button isLoading size="medium">M</Button>);
    expect(screen.getByTestId('spinner').textContent).toBe('spinner-md');
  });

  test('variant styles applied for outline and ghost', () => {
    const { rerender, container } = render(<Button variant="outline">O</Button>);
    // outline adds border-primary class in styles string; ensure class applied
    expect(container.querySelector('button').className).toContain('border-2');

    rerender(<Button variant="ghost">G</Button>);
    expect(container.querySelector('button').className).toContain('bg-transparent');
  });
});


