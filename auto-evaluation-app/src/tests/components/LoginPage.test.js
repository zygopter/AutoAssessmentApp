import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../components/LoginPage';

const mockLogin = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderLoginPage = () => render(
  <BrowserRouter>
    <LoginPage />
  </BrowserRouter>
);

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form', () => {
    renderLoginPage();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  it('calls login function on form submission', async () => {
    mockLogin.mockResolvedValue({ role: 'teacher' });
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
    expect(mockNavigate).toHaveBeenCalledWith('/teacher');
  });

  it('shows immediate feedback and prevents duplicate submits while login is pending', async () => {
    let resolveLogin;
    mockLogin.mockImplementation(() => new Promise((resolve) => {
      resolveLogin = resolve;
    }));
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    const pendingButton = screen.getByRole('button', { name: /connexion/i });
    expect(pendingButton).toBeDisabled();

    fireEvent.click(pendingButton);
    expect(mockLogin).toHaveBeenCalledTimes(1);

    resolveLogin({ role: 'teacher' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /se connecter/i })).not.toBeDisabled();
    });
  });

  it('re-enables submit and displays an error after a failed login', async () => {
    mockLogin.mockRejectedValue(new Error('Identifiants invalides'));
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(await screen.findByText('Identifiants invalides')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).not.toBeDisabled();
  });
});
