import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock socket.io-client
vi.mock('../socket', () => ({
  default: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn()
  },
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn()
}));

// Need to import after mocks
import App from '../App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to login when not authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    // Should show login form
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('shows dashboard when authenticated', () => {
    localStorage.setItem('user', JSON.stringify({ id: '1', username: 'testuser', email: 'test@test.com' }));
    localStorage.setItem('token', 'fake-token');

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('testuser')).toBeInTheDocument();
  });
});
