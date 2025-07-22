import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegistrationForm } from '../RegistrationForm';
import { ApiContextProvider } from '@/contexts/ApiContext';

// Mock fetch for the tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

const renderWithApiContext = (component: React.ReactElement) => {
    return render(
        <ApiContextProvider>
            {component}
        </ApiContextProvider>
    );
};

describe('RegistrationForm', () => {
    beforeEach(() => {
        mockFetch.mockClear();
    });

    it('renders all form fields', () => {
        renderWithApiContext(<RegistrationForm />);

        expect(screen.getByLabelText(/Vorname/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Nachname/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/E-Mail-Adresse/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Passwort/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Passwort bestätigen/i)).toBeInTheDocument();
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
        
        const emailInput = screen.getByLabelText(/E-Mail-Adresse/i);
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        
        const submitButton = screen.getByRole('button', { name: /Registrieren/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Ungültige E-Mail-Adresse')).toBeInTheDocument();
        });
    });

    it('validates password length', async () => {
        renderWithApiContext(<RegistrationForm />);
        
        const passwordInput = screen.getByLabelText(/^Passwort/i);
        fireEvent.change(passwordInput, { target: { value: 'short' } });
        
        const submitButton = screen.getByRole('button', { name: /Registrieren/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Passwort muss mindestens 8 Zeichen lang sein')).toBeInTheDocument();
        });
    });

    it('validates password confirmation match', async () => {
        renderWithApiContext(<RegistrationForm />);
        
        const passwordInput = screen.getByLabelText(/^Passwort/i);
        const confirmPasswordInput = screen.getByLabelText(/Passwort bestätigen/i);
        
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
        
        const passwordInput = screen.getByLabelText(/^Passwort/i);
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
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Registrierung erfolgreich', userId: 1 })
        });

        renderWithApiContext(<RegistrationForm onSuccess={onSuccessMock} />);
        
        // Fill in valid form data
        fireEvent.change(screen.getByLabelText(/Vorname/i), { target: { value: 'John' } });
        fireEvent.change(screen.getByLabelText(/Nachname/i), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByLabelText(/E-Mail-Adresse/i), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByLabelText(/^Passwort/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/Passwort bestätigen/i), { target: { value: 'password123' } });

        // Submit form
        const submitButton = screen.getByRole('button', { name: /Registrieren/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'john@example.com',
                    password: 'password123',
                    firstName: 'John',
                    lastName: 'Doe'
                })
            });
        });

        await waitFor(() => {
            expect(onSuccessMock).toHaveBeenCalledWith('john@example.com');
        });
    });

    it('displays error message on registration failure', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: 'E-Mail-Adresse ist bereits registriert.' })
        });

        renderWithApiContext(<RegistrationForm />);
        
        // Fill in form data
        fireEvent.change(screen.getByLabelText(/Vorname/i), { target: { value: 'John' } });
        fireEvent.change(screen.getByLabelText(/Nachname/i), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByLabelText(/E-Mail-Adresse/i), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByLabelText(/^Passwort/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/Passwort bestätigen/i), { target: { value: 'password123' } });

        // Submit form
        fireEvent.click(screen.getByRole('button', { name: /Registrieren/i }));

        await waitFor(() => {
            expect(screen.getByText('E-Mail-Adresse ist bereits registriert.')).toBeInTheDocument();
        });
    });

    it('shows loading state during submission', async () => {
        mockFetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

        renderWithApiContext(<RegistrationForm />);
        
        // Fill in form data
        fireEvent.change(screen.getByLabelText(/Vorname/i), { target: { value: 'John' } });
        fireEvent.change(screen.getByLabelText(/Nachname/i), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByLabelText(/E-Mail-Adresse/i), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByLabelText(/^Passwort/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/Passwort bestätigen/i), { target: { value: 'password123' } });

        // Submit form
        fireEvent.click(screen.getByRole('button', { name: /Registrieren/i }));

        expect(screen.getByText('Registrierung läuft...')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('displays helpful information about registration process', () => {
        renderWithApiContext(<RegistrationForm />);

        const infoText = screen.getByText(/Nach der Registrierung erhalten Sie eine E-Mail zur Bestätigung/i);
        expect(infoText).toBeInTheDocument();
    });
});