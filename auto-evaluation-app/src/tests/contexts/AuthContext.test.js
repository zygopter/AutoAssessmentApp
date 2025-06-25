import React from 'react';
import { render, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';

// Mock jwt-decode
jest.mock('jwt-decode');

// Mock de localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Composant de test
const TestComponent = () => {
  const { user, isAuthenticated } = useAuth();
  return (
    <div>
      <div data-testid="user">{JSON.stringify(user)}</div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with no user and not authenticated', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId('user').textContent).toBe('null');
    expect(getByTestId('isAuthenticated').textContent).toBe('false');
  });

  it('should authenticate user when valid token is in localStorage', () => {
    const mockUser = { id: '123', role: 'teacher' };
    mockLocalStorage.getItem.mockReturnValue('valid_token');
    jwtDecode.mockReturnValue({ user: mockUser });

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId('user').textContent).toBe(JSON.stringify(mockUser));
    expect(getByTestId('isAuthenticated').textContent).toBe('true');
  });

  // Ajoutez plus de tests pour login, logout, register, etc.
});