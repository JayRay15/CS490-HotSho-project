import { render, screen } from '@testing-library/react';
import ErrorMessage from '../ErrorMessage.jsx';

describe('ErrorMessage', () => {
  test('renders provided message', () => {
    const error = { customError: { message: 'Something went wrong' } };
    render(<ErrorMessage error={error} />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});


