'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApi } from '@/contexts/ApiContext';
import { PendingUser } from '@/lib/types/api';

export default function UserManagementPage() {
    const { apiClient } = useApi();
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [approvingUserId, setApprovingUserId] = useState<number | null>(null);

    const fetchPendingUsers = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const users = await apiClient.getPendingUsers();
            setPendingUsers(users);
        } catch (error: unknown) {
            const errorMessage = error && typeof error === 'object' && 'message' in error 
                ? String((error as { message: string }).message) 
                : 'Fehler beim Laden der wartenden Benutzer';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const approveUser = async (userId: number) => {
        setApprovingUserId(userId);
        
        try {
            const result = await apiClient.approveUser(userId);
            
            // Remove approved user from pending list
            setPendingUsers(users => users.filter(user => user.id !== userId));
            
            // Show success message (you could use a toast library here)
            alert(`✅ ${result.message}`);
            
        } catch (error: unknown) {
            const errorMessage = error && typeof error === 'object' && 'message' in error 
                ? String((error as { message: string }).message) 
                : 'Fehler beim Freigeben des Benutzers';
            alert(`❌ Fehler: ${errorMessage}`);
        } finally {
            setApprovingUserId(null);
        }
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Benutzer-Freigabe</h1>
                    <p className="text-gray-600 mt-2">
                        Benutzer, die ihre E-Mail-Adresse bestätigt haben und auf Freigabe warten.
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <button
                        onClick={fetchPendingUsers}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                Aktualisierung...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Aktualisieren
                            </>
                        )}
                    </button>
                    
                    <Link
                        href="/admin"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Zurück zum Admin
                    </Link>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
            ) : pendingUsers.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                        Keine wartenden Benutzer
                    </h3>
                    <p className="mt-2 text-gray-600">
                        Alle Benutzer sind bereits freigegeben oder haben ihre E-Mail-Adresse noch nicht bestätigt.
                    </p>
                </div>
            ) : (
                <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Benutzer
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        E-Mail
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Registriert
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        E-Mail bestätigt
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aktion
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pendingUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                                                    <span className="text-indigo-600 font-medium">
                                                        {user.firstName[0]}{user.lastName[0]}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.firstName} {user.lastName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        ID: {user.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {formatDate(user.registrationDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {user.emailVerified ? (
                                                    <>
                                                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span className="text-sm text-green-800">
                                                            {formatDate(user.emailVerifiedAt)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                                                        </svg>
                                                        <span className="text-sm text-yellow-800">
                                                            Ausstehend
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => approveUser(user.id)}
                                                disabled={approvingUserId === user.id}
                                                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
                                            >
                                                {approvingUserId === user.id ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                                        Freigabe...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Freigeben
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {pendingUsers.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h3 className="text-sm font-medium text-blue-800">Hinweis</h3>
                            <p className="mt-1 text-sm text-blue-700">
                                Nach der Freigabe erhalten Benutzer eine Willkommens-E-Mail und können sofort Buchungen vornehmen.
                                Nur Benutzer mit verifizierten E-Mail-Adressen können freigegeben werden.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}