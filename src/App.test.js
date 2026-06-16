import { render, screen } from '@testing-library/react';
import App from './App';

test('renders fixed income dashboard by default', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /fixed income/i })).toBeInTheDocument();
  expect(screen.getByText(/ecb aaa yield curve \+ country 10y benchmarks/i)).toBeInTheDocument();
});
