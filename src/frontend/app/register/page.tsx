'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RegistrationForm } from '@/app/components/auth/RegistrationForm';

export default function RegisterPage() {
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    if (registrationSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900">
                            Registrierung erfolgreich!
                        </h2>
                        <div className="mt-4 p-4 bg-green-100 rounded-lg border border-green-300">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-green-800">
                                        Bitte bestätigen Sie Ihre E-Mail-Adresse
                                    </h3>
                                    <div className="mt-2 text-sm text-green-700">
                                        <p>
                                            Wir haben Ihnen einen Bestätigungslink an{' '}
                                            <strong>{userEmail}</strong> gesendet.
                                        </p>
                                        <p className="mt-2">
                                            Bitte überprüfen Sie Ihr E-Mail-Postfach und klicken Sie auf den Bestätigungslink, 
                                            um Ihre Registrierung abzuschließen.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6">
                            <Link
                                href="/login"
                                className="text-indigo-600 hover:text-indigo-500 font-medium"
                            >
                                Zum Login zurückkehren
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900">
                        Registrierung
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Erstellen Sie Ihr Konto für das Buchungssystem
                    </p>
                </div>
                
                <RegistrationForm 
                    onSuccess={(email) => {
                        setUserEmail(email);
                        setRegistrationSuccess(true);
                    }}
                />
                
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Bereits ein Konto?{' '}
                        <Link
                            href="/login"
                            className="text-indigo-600 hover:text-indigo-500 font-medium"
                        >
                            Hier einloggen
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}