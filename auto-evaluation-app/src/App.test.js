import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./contexts/CompetencesContext', () => ({
  CompetencesProvider: ({ children }) => children,
  useCompetences: () => ({ classes: [], categories: [], formulaires: [] }),
}));

jest.mock('./contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, logout: jest.fn() }),
  AuthConsumer: ({ children }) => children({
    isLoggedIn: false,
    user: null,
    logout: jest.fn(),
  }),
}));

test('renders the login page for anonymous users', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument();
});
