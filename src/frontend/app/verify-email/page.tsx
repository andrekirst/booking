'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '@/contexts/ApiContext';

type VerificationStatus = 'loading' | 'success' | 'error' | 'invalid';

export default function VerifyEmailPage() {
    const { apiClient } = useApi();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<VerificationStatus>('loading');
    const [message, setMessage] = useState('');
    const [requiresApproval, setRequiresApproval] = useState(false);

    useEffect(() => {
        const token = searchParams.get('token');
        
        if (!token) {
            setStatus('invalid');
            setMessage('Kein Bestätigungstoken gefunden.');
            return;
        }

        verifyEmail(token);
    }, [searchParams]);

    const verifyEmail = async (token: string) => {
        try {
            const data = await apiClient.verifyEmail({ token });
            setStatus('success');
            setMessage(data.message);
            setRequiresApproval(data.requiresApproval);
        } catch (error: unknown) {
            setStatus('error');
            const errorMessage = error && typeof error === 'object' && 'message' in error 
                ? String((error as { message: string }).message) 
                : 'Bestätigung fehlgeschlagen.';
            setMessage(errorMessage);
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'loading':
                return (
                    <svg className="animate-spin h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                );
            case 'success':
                return (
                    <svg className="h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                );
            case 'error':
            case 'invalid':
                return (
                    <svg className="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                );
        }
    };

    const getStatusTitle = () => {
        switch (status) {
            case 'loading':
                return 'E-Mail wird bestätigt...';
            case 'success':
                return 'E-Mail erfolgreich bestätigt!';
            case 'error':
                return 'Bestätigung fehlgeschlagen';
            case 'invalid':
                return 'Ungültiger Link';
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'loading':
                return 'text-gray-900';
            case 'success':
                return 'text-green-900';
            case 'error':
            case 'invalid':
                return 'text-red-900';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center">
                <div className="flex justify-center">
                    {getStatusIcon()}
                </div>
                
                <h2 className={`text-3xl font-bold ${getStatusColor()}`}>
                    {getStatusTitle()}
                </h2>

                {message && (
                    <div className={`p-4 rounded-lg border ${
                        status === 'success' 
                            ? 'bg-green-100 border-green-300 text-green-800'
                            : 'bg-red-100 border-red-300 text-red-800'
                    }`}>
                        <p className="text-sm">{message}</p>
                        
                        {status === 'success' && requiresApproval && (
                            <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded">
                                <div className="flex items-center">
                                    <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <div className="text-blue-800 text-sm">
                                        <p className="font-medium">Nächste Schritte:</p>
                                        <p className="mt-1">
                                            Ihr Konto wurde erfolgreich verifiziert, wartet aber noch auf die 
                                            Freigabe durch einen Administrator. Sie erhalten eine weitere E-Mail, 
                                            sobald Ihr Konto für Buchungen freigeschaltet wurde.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-4">
                    {status === 'success' ? (
                        <Link
                            href="/login"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                        >
                            Zum Login
                        </Link>
                    ) : status === 'error' ? (
                        <div className="space-y-3">
                            <ResendVerificationForm />
                            <Link
                                href="/register"
                                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                            >
                                Neue Registrierung
                            </Link>
                        </div>
                    ) : status === 'invalid' ? (
                        <Link
                            href="/register"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                        >
                            Zur Registrierung
                        </Link>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function ResendVerificationForm() {
    const { apiClient } = useApi();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleResend = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
            setIsSuccess(false);
            return;
        }

        setIsSubmitting(true);
        setMessage('');

        try {
            const data = await apiClient.resendVerification({ email });
            setMessage(data.message);
            setIsSuccess(true);
            setEmail('');
        } catch (error: unknown) {
            const errorMessage = error && typeof error === 'object' && 'message' in error 
                ? String((error as { message: string }).message) 
                : 'Fehler beim Senden des Bestätigungslinks.';
            setMessage(errorMessage);
            setIsSuccess(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
                Bestätigungslink erneut senden
            </h3>
            
            {message && (
                <div className={`mb-4 p-3 rounded border ${
                    isSuccess 
                        ? 'bg-green-100 border-green-300 text-green-800'
                        : 'bg-red-100 border-red-300 text-red-800'
                }`}>
                    <p className="text-sm">{message}</p>
                </div>
            )}
            
            <form onSubmit={handleResend} className="space-y-4">
                <div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ihre E-Mail-Adresse"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={isSubmitting}
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
                        isSubmitting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500'
                    } transition duration-150 ease-in-out`}
                >
                    {isSubmitting ? 'Wird gesendet...' : 'Link erneut senden'}
                </button>
            </form>
        </div>
    );
}