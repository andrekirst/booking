import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegistrationForm } from '../RegistrationForm';
import { ApiContextProvider } from '@/contexts/ApiContext';

// Mock the API factory to return a controlled mock
jest.mock('@/lib/api/factory', () => {
  const mockRegister = jest.fn();
  const mockClient = {
    register: mockRegister,
  };
  return {
    getApiClient: () => mockClient,
    apiClient: mockClient,
  };
});

// Get the mocked register function for test assertions
import { apiClient } from '@/lib/api/factory';
const mockRegister = (apiClient as any).register;

const renderWithApiContext = (component: React.ReactElement) => {
    return render(
        <ApiContextProvider>
            {component}
        </ApiContextProvider>
    );
};

describe('RegistrationForm', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        mockRegister.mockClear();
    });

    it('renders all form fields', () => {
        renderWithApiContext(<RegistrationForm />);

        expect(screen.getByLabelText(/Vorname/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Nachname/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/E-Mail-Adresse/i)).toBeInTheDocument();
        expect(screen.getByLabelText('Passwort *')).toBeInTheDocument();
        expect(screen.getByLabelText('Passwort bestätigen *')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Registrieren/i })).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        renderWithApiContext(<RegistrationForm />);
        
        const submitButton = screen.getByRole('button', { name: /Registrieren/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Vorname ist erforderlich')).toBeInTheDocument();
            expect(screen.getByText('Nachname ist erforderlich')).toBeInTheDocument();
            expect(screen.getByText('E-Mail-Adresse ist erforderlich')).toBeInTheDocument();
            expect(screen.getByText('Passwort ist erforderlich')).toBeInTheDocument();
            expect(screen.getByText('Passwort-Bestätigung ist erforderlich')).toBeInTheDocument();
        });
    });

    it('validates email format', async () => {
        renderWithApiContext(<RegistrationForm />);
        
        // Fill in all required fields except email with invalid format
        fireEvent.change(screen.getByLabelText(/Vorname/i), { target: { value: 'John' } });
        fireEvent.change(screen.getByLabelText(/Nachname/i), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByLabelText(/E-Mail-Adresse/i), { target: { value: 'invalid-email' } });
        fireEvent.change(screen.getByLabelText('Passwort *'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText('Passwort bestätigen *'), { target: { value: 'password123' } });
        
        const submitButton = screen.getByRole('button', { name: /Registrieren/i });
        fireEvent.click(submitButton);

        // The validation should prevent API call, so register should not be called
        await waitFor(() => {
            expect(screen.getByText('Ungültige E-Mail-Adresse')).toBeInTheDocument();
        });
        
        // API should not be called due to client-side validation
        expect(mockRegister).not.toHaveBeenCalled();
    });

    it('validates password length', async () => {
        renderWithApiContext(<RegistrationForm />);
        
        const passwordInput = screen.getByLabelText('Passwort *');
        fireEvent.change(passwordInput, { target: { value: 'short' } });
        
        const submitButton = screen.getByRole('button', { name: /Registrieren/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Passwort muss mindestens 8 Zeichen lang sein')).toBeInTheDocument();
        });
    });

    it('validates password confirmation match', async () => {
        renderWithApiContext(<RegistrationForm />);
        
        const passwordInput = screen.getByLabelText('Passwort *');
        const confirmPasswordInput = screen.getByLabelText('Passwort bestätigen *');
        
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
        
        const submitButton = screen.getByRole('button', { name: /Registrieren/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Passwörter stimmen nicht überein')).toBeInTheDocument();
        });
    });

    it('shows password strength indicator when typing password', () => {
        renderWithApiContext(<RegistrationForm />);
        
        const passwordInput = screen.getByLabelText('Passwort *');
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        expect(screen.getByText('Passwort-Stärke')).toBeInTheDocument();
        expect(screen.getByText('Anforderungen:')).toBeInTheDocument();
    });

    it('clears field errors when user types', async () => {
        renderWithApiContext(<RegistrationForm />);
        
        // Trigger validation error
        const submitButton = screen.getByRole('button', { name: /Registrieren/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Vorname ist erforderlich')).toBeInTheDocument();
        });

        // Clear error by typing
        const firstNameInput = screen.getByLabelText(/Vorname/i);
        fireEvent.change(firstNameInput, { target: { value: 'John' } });

        await waitFor(() => {
            expect(screen.queryByText('Vorname ist erforderlich')).not.toBeInTheDocument();
        });
    });

    it('submits form with valid data', async () => {
        const onSuccessMock = jest.fn();
        
        // Mock successful registration response
        mockRegister.mockResolvedValueOnce({
            message: 'Registrierung erfolgreich',
            userId: 'mock-user-123'
        });

        renderWithApiContext(<RegistrationForm onSuccess={onSuccessMock} />);
        
        // Fill in valid form data
        fireEvent.change(screen.getByLabelText(/Vorname/i), { target: { value: 'John' } });
        fireEvent.change(screen.getByLabelText(/Nachname/i), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByLabelText(/E-Mail-Adresse/i), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByLabelText('Passwort *'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText('Passwort bestätigen *'), { target: { value: 'password123' } });

        // Submit form
        const submitButton = screen.getByRole('button', { name: /Registrieren/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith({
                email: 'john@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe'
            });
        });

        await waitFor(() => {
            expect(onSuccessMock).toHaveBeenCalledWith('john@example.com');
        });
    });

    it('displays error message on registration failure', async () => {
        // Mock API error
        mockRegister.mockRejectedValueOnce({
            message: 'E-Mail-Adresse ist bereits registriert.'
        });

        renderWithApiContext(<RegistrationForm />);
        
        // Fill in form data
        fireEvent.change(screen.getByLabelText(/Vorname/i), { target: { value: 'John' } });
        fireEvent.change(screen.getByLabelText(/Nachname/i), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByLabelText(/E-Mail-Adresse/i), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByLabelText('Passwort *'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText('Passwort bestätigen *'), { target: { value: 'password123' } });

        // Submit form
        fireEvent.click(screen.getByRole('button', { name: /Registrieren/i }));

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(screen.getByText('E-Mail-Adresse ist bereits registriert.')).toBeInTheDocument();
        });
    });

    it('shows loading state during submission', async () => {
        // Mock slow API response to test loading state
        mockRegister.mockImplementationOnce(
            () => new Promise(resolve => setTimeout(() => resolve({
                message: 'Registrierung erfolgreich',
                userId: 'test-user'
            }), 100))
        );

        renderWithApiContext(<RegistrationForm />);
        
        // Fill in form data
        fireEvent.change(screen.getByLabelText(/Vorname/i), { target: { value: 'John' } });
        fireEvent.change(screen.getByLabelText(/Nachname/i), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByLabelText(/E-Mail-Adresse/i), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByLabelText('Passwort *'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText('Passwort bestätigen *'), { target: { value: 'password123' } });

        // Submit form
        fireEvent.click(screen.getByRole('button', { name: /Registrieren/i }));

        // Check loading state
        expect(screen.getByText('Registrierung läuft...')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeDisabled();

        // Wait for completion
        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalled();
        });
    });

    it('displays helpful information about registration process', () => {
        renderWithApiContext(<RegistrationForm />);

        const infoText = screen.getByText(/Nach der Registrierung erhalten Sie eine E-Mail zur Bestätigung/i);
        expect(infoText).toBeInTheDocument();
    });
});