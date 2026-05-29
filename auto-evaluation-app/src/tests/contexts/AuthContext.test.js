import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

let authStateCallback;
const mockUnsubscribe = jest.fn();
const mockGetSession = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();
const mockMaybeSingle = jest.fn();
const mockEq = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));
const mockOnAuthStateChange = jest.fn((callback) => {
  authStateCallback = callback;
  return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
});

jest.mock('../../services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: (...args) => mockGetSession(...args),
      onAuthStateChange: (...args) => mockOnAuthStateChange(...args),
      signInWithPassword: (...args) => mockSignInWithPassword(...args),
      signUp: (...args) => mockSignUp(...args),
      signOut: (...args) => mockSignOut(...args),
    },
    from: (...args) => mockFrom(...args),
  },
}));

const session = {
  user: {
    id: 'user-1',
    email: 'teacher@example.com',
  },
};

const profile = {
  id: 'user-1',
  name: 'Teacher',
  role: 'teacher',
};

const TestComponent = () => {
  const { user, isAuthenticated, loading, login } = useAuth();
  return (
    <div>
      <div data-testid="user">{JSON.stringify(user)}</div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      <div data-testid="loading">{loading.toString()}</div>
      <button type="button" onClick={() => login({ email: 'teacher@example.com', password: 'secret' })}>
        Login
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    authStateCallback = undefined;
    mockMaybeSingle.mockResolvedValue({ data: profile, error: null });
    mockEq.mockImplementation(() => ({ maybeSingle: mockMaybeSingle }));
    mockSelect.mockImplementation(() => ({ eq: mockEq }));
    mockFrom.mockImplementation(() => ({ select: mockSelect }));
    mockOnAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignInWithPassword.mockResolvedValue({ data: { session }, error: null });
    mockSignUp.mockResolvedValue({ data: { session }, error: null });
  });

  it('initializes with no user and not authenticated', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
  });

  it('hydrates user after a successful login', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByRole('button', { name: /login/i }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe(JSON.stringify({ ...profile, email: session.user.email }));
    });
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
  });

  it('defers Supabase profile reads from auth state changes to avoid blocking later logins', async () => {
    jest.useFakeTimers();
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalled());
    mockFrom.mockClear();

    act(() => {
      authStateCallback('SIGNED_IN', session);
    });

    expect(mockFrom).not.toHaveBeenCalled();

    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
    });

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    jest.useRealTimers();
  });
});
