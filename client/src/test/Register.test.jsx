import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register';

describe('Register Page', () => {
  const renderRegister = () => {
    const onLogin = vi.fn();
    render(
      <BrowserRouter>
        <Register onLogin={onLogin} />
      </BrowserRouter>
    );
    return { onLogin };
  };

  it('renders registration form', () => {
    renderRegister();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('has link to login page', () => {
    renderRegister();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it('requires all fields', () => {
    renderRegister();
    expect(screen.getByLabelText(/username/i)).toBeRequired();
    expect(screen.getByLabelText(/email/i)).toBeRequired();
    expect(screen.getByLabelText(/password/i)).toBeRequired();
  });

  it('password has minimum length', () => {
    renderRegister();
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('minLength', '6');
  });
});
