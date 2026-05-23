import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';

describe('Login Page', () => {
  const renderLogin = () => {
    const onLogin = vi.fn();
    render(
      <BrowserRouter>
        <Login onLogin={onLogin} />
      </BrowserRouter>
    );
    return { onLogin };
  };

  it('renders login form', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('has link to register page', () => {
    renderLogin();
    expect(screen.getByText(/create one/i)).toBeInTheDocument();
  });

  it('requires email and password fields', () => {
    renderLogin();
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it('allows typing in email field', () => {
    renderLogin();
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
  });
});
