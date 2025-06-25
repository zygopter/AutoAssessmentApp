import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../components/LoginPage';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock de la fonction login
const mockLogin = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => ({
    login: mockLogin,
  }),
}));

describe('LoginPage', () => {
  it('renders login form', () => {
    const { getByLabelText, getByRole } = render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(getByLabelText(/email/i)).toBeInTheDocument();
    expect(getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  it('calls login function on form submission', async () => {
    const { getByLabelText, getByRole } = render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.change(getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(getByLabelText(/mot de passe/i), { target: { value: 'password123' } });
    fireEvent.click(getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  // Ajoutez plus de tests pour gérer les erreurs, la redirection après connexion, etc.
});