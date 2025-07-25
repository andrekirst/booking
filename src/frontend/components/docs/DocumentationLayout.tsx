'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface DocumentationLayoutProps {
  title: string;
  children: ReactNode;
  prevPage?: { title: string; href: string };
  nextPage?: { title: string; href: string };
  breadcrumbs?: Array<{ title: string; href?: string }>;
}

export default function DocumentationLayout({
  title,
  children,
  prevPage,
  nextPage,
  breadcrumbs = []
}: DocumentationLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {breadcrumbs.length > 0 && (
                <nav className="flex mt-2" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2 text-sm">
                    <li>
                      <Link href="/help" className="text-blue-600 hover:text-blue-800">
                        📖 Benutzerhandbuch
                      </Link>
                    </li>
                    {breadcrumbs.map((crumb, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-gray-400 mx-2">/</span>
                        {crumb.href ? (
                          <Link href={crumb.href} className="text-blue-600 hover:text-blue-800">
                            {crumb.title}
                          </Link>
                        ) : (
                          <span className="text-gray-600">{crumb.title}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
            </div>
            <Link
              href="/help"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              ← Zurück zur Übersicht
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="prose prose-lg max-w-none p-8">
            {children}
          </div>
        </div>

        {/* Navigation */}
        {(prevPage || nextPage) && (
          <div className="flex justify-between items-center mt-8 pt-8 border-t">
            <div>
              {prevPage && (
                <Link
                  href={prevPage.href}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  ← {prevPage.title}
                </Link>
              )}
            </div>
            <div>
              {nextPage && (
                <Link
                  href={nextPage.href}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {nextPage.title} →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-100 border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              📖 Benutzerhandbuch der Buchungsplattform
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/help" className="hover:text-blue-600">Übersicht</Link>
              <Link href="/help/faq" className="hover:text-blue-600">FAQ</Link>
              <Link href="/" className="hover:text-blue-600">Zur Anwendung</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}