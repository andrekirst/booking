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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">{title}</h1>
              {breadcrumbs.length > 0 && (
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2 text-sm text-gray-500">
                    <li>
                      <Link href="/help" className="hover:text-gray-700">
                        Benutzerhandbuch
                      </Link>
                    </li>
                    {breadcrumbs.map((crumb, index) => (
                      <li key={index} className="flex items-center">
                        <span className="mx-2">/</span>
                        {crumb.href ? (
                          <Link href={crumb.href} className="hover:text-gray-700">
                            {crumb.title}
                          </Link>
                        ) : (
                          <span className="text-gray-900">{crumb.title}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
            </div>
            <Link
              href="/help"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Übersicht
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="prose prose-lg max-w-none">
          {children}
        </div>

        {/* Navigation */}
        {(prevPage || nextPage) && (
          <div className="flex justify-between items-center mt-16 pt-8 border-t border-gray-200">
            <div>
              {prevPage && (
                <Link
                  href={prevPage.href}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  ← {prevPage.title}
                </Link>
              )}
            </div>
            <div>
              {nextPage && (
                <Link
                  href={nextPage.href}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {nextPage.title} →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Benutzerhandbuch der Buchungsplattform
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/help" className="hover:text-gray-900">Übersicht</Link>
              <Link href="/help/faq" className="hover:text-gray-900">FAQ</Link>
              <Link href="/" className="hover:text-gray-900">Zur Anwendung</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}