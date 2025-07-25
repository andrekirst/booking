'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RegistrationForm } from '@/app/components/auth/RegistrationForm';
import { useApi } from '@/contexts/ApiContext';
import HelpButton from '@/components/ui/HelpButton';

export default function RegisterPage() {
    const { apiClient } = useApi();
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState<string | null>(null);

    const handleResendEmail = async () => {
        setIsResending(true);
        setResendMessage(null);
        
        try {
            const response = await apiClient.resendVerification({ email: userEmail });
            setResendMessage(`✅ ${response.message}`);
        } catch (error) {
            console.error('Failed to resend verification email:', error);
            setResendMessage(`❌ ${error instanceof Error ? error.message : 'Fehler beim Senden der E-Mail'}`);
        } finally {
            setIsResending(false);
        }
    };

    if (registrationSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-blue-100/20 border border-white/20 p-8">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <h2 className="text-3xl font-bold text-gray-900">
                                    Registrierung erfolgreich!
                                </h2>
                                <HelpButton topic="email-verification" variant="text" size="sm" />
                            </div>
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
                            
                            {/* Resend Email Section */}
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-700 mb-3">
                                    Keine E-Mail erhalten? Sie können die Bestätigungs-E-Mail erneut anfordern.
                                </p>
                                <button
                                    onClick={handleResendEmail}
                                    disabled={isResending}
                                    className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isResending ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Wird gesendet...
                                        </span>
                                    ) : (
                                        'Bestätigungs-E-Mail erneut senden'
                                    )}
                                </button>
                            </div>

                            {/* Status Message */}
                            {resendMessage && (
                                <div className={`mt-4 p-3 rounded-lg text-sm ${
                                    resendMessage.startsWith('✅') 
                                        ? 'bg-green-50 text-green-700 border border-green-200' 
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                    {resendMessage}
                                </div>
                            )}

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