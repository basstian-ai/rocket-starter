import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page'; // Adjusted path
import UserStatus from '@/components/layout/navbar/user-status'; // Adjusted path
// import Navbar from '@/components/layout/navbar'; // Alternative if UserStatus is deeply nested

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(), // Add other methods if used by the components
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/', // Mock usePathname if used by Navbar or UserStatus
  useSearchParams: () => new URLSearchParams(), // Mock useSearchParams if used
}));

// Helper to clear localStorage and mockPush before each test
beforeEach(() => {
  localStorage.clear();
  mockPush.mockClear();
  // Reset fetch mock if it's configured per test or globally in a beforeAll/beforeEach
  if (global.fetch && typeof global.fetch.mockReset === 'function') {
    global.fetch.mockReset(); // Use mockReset to clear mock state and implementations
  }
});

describe('Login Functionality', () => {
  // Test cases will go here
  it('should allow a user to log in successfully and display their name in navbar', async () => {
    // Mock successful API response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: '1',
          firstName: 'Test',
          username: 'testuser'
        }),
      })
    ) as jest.Mock;

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/account');
    });
    expect(localStorage.getItem('userId')).toBe('1');
    expect(localStorage.getItem('userFirstName')).toBe('Test');
    expect(localStorage.getItem('username')).toBe('testuser');

    // Render UserStatus to check navbar display
    // Need to ensure UserStatus re-reads from localStorage after it's set
    // Re-rendering might be necessary or ensuring its internal useEffects pick up the change.
    // For simplicity, we can re-render it or rely on its useEffect listeners for 'storage' if they work in JSDOM.
    // A more robust way might involve wrapping UserStatus in a component that allows us to trigger a re-read or state update.

    // To ensure UserStatus component picks up the localStorage changes, we re-render it.
    // In a real app, navigation would cause a re-render of the Navbar.
    const { rerender } = render(<UserStatus />);
    rerender(<UserStatus />); // Force re-render to pick up localStorage changes

    await waitFor(() => {
      expect(screen.getByText(/Hi, Test/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });
  });

  it('should display an error message for invalid credentials', async () => {
    // Mock failed API response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid username or password.' }),
      })
    ) as jest.Mock;

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/username/i), 'wronguser');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid username or password./i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(localStorage.getItem('userId')).toBeNull();

    // Check navbar still shows login
    const { rerender } = render(<UserStatus />);
    rerender(<UserStatus />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(screen.queryByText(/Hi,/i)).not.toBeInTheDocument(); // Ensure no user greeting
    });
  });
});
