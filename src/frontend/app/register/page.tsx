'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RegistrationForm } from '@/app/components/auth/RegistrationForm';

export default function RegisterPage() {
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    if (registrationSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-blue-100/20 border border-white/20 p-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-gray-900">
                                Registrierung erfolgreich!
                            </h2>
                            <div className="mt-6 p-6 bg-emerald-50 rounded-2xl border border-emerald-200">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-6 w-6 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-semibold text-emerald-800">
                                            Bitte bestätigen Sie Ihre E-Mail-Adresse
                                        </h3>
                                        <div className="mt-2 text-sm text-emerald-700">
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
                                    className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                                >
                                    Zum Login zurückkehren
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Registration Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-blue-100/20 border border-white/20 p-8">
                    {/* Back to Login Button */}
                    <div className="mb-6">
                        <Link
                            href="/login"
                            className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            Zurück zum Login
                        </Link>
                    </div>

                    <div className="text-center mb-8">
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
                    
                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-600">
                            Bereits ein Konto?{' '}
                            <Link
                                href="/login"
                                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                            >
                                Hier einloggen
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}