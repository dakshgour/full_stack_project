import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('client app', () => {
  test('signup validation shows error for short name', async () => {
    render(<App />);
    await userEvent.click(screen.getByText('Signup'));
    await userEvent.type(screen.getByLabelText('Name'), 'A');
    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'SecurePass123!');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Name must be at least 2 characters')).toBeInTheDocument();
  });

  test('protected dashboard redirects to login when unauthenticated', async () => {
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    expect(await screen.findByText('Login to unlock API features')).toBeInTheDocument();
  });

  test('dashboard renders after token restore', async () => {
    window.localStorage.setItem('dsa_token', 'test-token');
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { user: { id: 1, name: 'Daksh', email: 'daksh@example.com' } } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            summary: { savedCodes: 1, executionCount: 1, visualizationCount: 1, mostUsedPattern: 'binarySearch' },
            recentCodes: [{ id: 1, title: 'Binary Search', language: 'javascript', dsaPattern: 'binarySearch', testCases: [] }],
            recentExecutions: [{ id: 1, patternDetected: 'binarySearch', language: 'javascript', status: 'success' }],
            recentVisualizations: [{ id: 1, pattern: 'binarySearch', steps: [{ title: 'step' }] }],
          },
        }),
      });

    window.history.pushState({}, '', '/dashboard');
    render(<App />);

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Saved Codes' })).toBeInTheDocument());
    expect(screen.getByText('Most Used Pattern')).toBeInTheDocument();
    expect(screen.getByText('Binary Search')).toBeInTheDocument();
    window.localStorage.removeItem('dsa_token');
  });
});
