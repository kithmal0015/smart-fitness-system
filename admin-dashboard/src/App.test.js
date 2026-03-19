import { render, screen } from '@testing-library/react';
import App from './App';

test('renders loading screen first', () => {
  render(<App />);
  const loadingHeading = screen.getByRole('heading', { name: /loading/i });
  expect(loadingHeading).toBeInTheDocument();
});
