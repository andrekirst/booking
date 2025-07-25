'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';

interface DocumentationLayoutProps {
  title: string;
  children: ReactNode;
  prevPage?: { title: string; href: string };
  nextPage?: { title: string; href: string };
  breadcrumbs?: Array<{ title: string; href?: string }>;
}

const navigationItems = [
  { title: 'Übersicht', href: '/help', icon: '📚' },
  { title: 'Einleitung', href: '/help/einleitung', icon: '👋' },
  { title: 'Erste Schritte', href: '/help/erste-schritte', icon: '🚀' },
  { title: 'Buchungen verwalten', href: '/help/buchungen', icon: '📅' },
  { title: 'Räume & Schlafplätze', href: '/help/raeume', icon: '🏨' },
  { title: 'Administration', href: '/help/administration', icon: '⚙️' },
  { title: 'FAQ', href: '/help/faq', icon: '❓' },
];

export default function DocumentationLayout({
  title,
  children,
  prevPage,
  nextPage,
  breadcrumbs = []
}: DocumentationLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              ← Zur Anwendung
            </Link>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>📖</span>
            <span>Benutzerhandbuch</span>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 overflow-y-auto`}>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Inhaltsverzeichnis</h2>
            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors group"
                >
                  <span className="mr-3 text-gray-400 group-hover:text-blue-600">{item.icon}</span>
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Content Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-6 py-8">
              {breadcrumbs.length > 0 && (
                <nav className="flex mb-4" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2 text-sm text-gray-500">
                    <li>
                      <Link href="/help" className="text-blue-600 hover:text-blue-700">
                        Benutzerhandbuch
                      </Link>
                    </li>
                    {breadcrumbs.map((crumb, index) => (
                      <li key={index} className="flex items-center">
                        <svg className="mx-2 w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        {crumb.href ? (
                          <Link href={crumb.href} className="text-blue-600 hover:text-blue-700">
                            {crumb.title}
                          </Link>
                        ) : (
                          <span className="text-gray-900 font-medium">{crumb.title}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>
          </div>

          {/* Content Body */}
          <div className="px-6 py-8">
            <div className="max-w-4xl">
              <div className="prose prose-blue max-w-none">
                {children}
              </div>

              {/* Page Navigation */}
              {(prevPage || nextPage) && (
                <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200">
                  <div>
                    {prevPage && (
                      <Link
                        href={prevPage.href}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        {prevPage.title}
                      </Link>
                    )}
                  </div>
                  <div>
                    {nextPage && (
                      <Link
                        href={nextPage.href}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        {nextPage.title}
                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}