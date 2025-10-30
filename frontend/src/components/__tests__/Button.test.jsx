import { render, screen } from '@testing-library/react';
import Button from '../Button.jsx';

describe('Button', () => {
  test('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});


