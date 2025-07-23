'use client';

import { useState } from 'react';
import { useApi } from '@/contexts/ApiContext';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

interface RegistrationFormProps {
    onSuccess?: (email: string) => void;
}

interface FormData {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
}

interface FormErrors {
    email?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
    general?: string;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
    const { apiClient } = useApi();
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: ''
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // Email validation
        if (!formData.email) {
            newErrors.email = 'E-Mail-Adresse ist erforderlich';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Ungültige E-Mail-Adresse';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Passwort ist erforderlich';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Passwort muss mindestens 8 Zeichen lang sein';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwort-Bestätigung ist erforderlich';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
        }

        // First name validation
        if (!formData.firstName.trim()) {
            newErrors.firstName = 'Vorname ist erforderlich';
        }

        // Last name validation  
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Nachname ist erforderlich';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Clear field-specific error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastName: formData.lastName
                }),
            });

            const data = await response.json();

            if (response.ok) {
                onSuccess?.(formData.email);
            } else {
                setErrors({ general: data.message || 'Registrierung fehlgeschlagen' });
            }
        } catch (error) {
            setErrors({ general: 'Ein Netzwerkfehler ist aufgetreten. Bitte versuchen Sie es erneut.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
                <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
                    <p className="text-sm text-red-700">{errors.general}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-900">
                        Vorname *
                    </label>
                    <input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                            errors.firstName ? 'border-red-300 bg-red-50' : ''
                        }`}
                        placeholder="Max"
                    />
                    {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-900">
                        Nachname *
                    </label>
                    <input
                        id="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                            errors.lastName ? 'border-red-300 bg-red-50' : ''
                        }`}
                        placeholder="Mustermann"
                    />
                    {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                    )}
                </div>
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                    E-Mail-Adresse *
                </label>
                <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.email ? 'border-red-300 bg-red-50' : ''
                    }`}
                    placeholder="max@example.com"
                />
                {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                    Passwort *
                </label>
                <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.password ? 'border-red-300 bg-red-50' : ''
                    }`}
                    placeholder="Mindestens 8 Zeichen"
                />
                {formData.password && (
                    <div className="mt-2">
                        <PasswordStrengthIndicator password={formData.password} />
                    </div>
                )}
                {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900">
                    Passwort bestätigen *
                </label>
                <input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.confirmPassword ? 'border-red-300 bg-red-50' : ''
                    }`}
                    placeholder="Passwort wiederholen"
                />
                {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
            </div>

            <div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
                        isSubmitting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    } transition duration-150 ease-in-out`}
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Registrierung läuft...
                        </>
                    ) : (
                        'Registrieren'
                    )}
                </button>
            </div>

            <div className="text-xs text-gray-700">
                <p>
                    * Pflichtfelder. Nach der Registrierung erhalten Sie eine E-Mail zur Bestätigung Ihrer Adresse. 
                    Anschließend wird Ihr Konto von einem Administrator für Buchungen freigeschaltet.
                </p>
            </div>
        </form>
    );
}