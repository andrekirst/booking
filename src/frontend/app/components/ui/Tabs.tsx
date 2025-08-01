'use client';

import { useState, ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  onActivate?: () => void;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

export default function Tabs({ tabs, defaultTab }: TabsProps) {
  // Find the first non-disabled tab or use the specified default if it's not disabled
  const getValidDefaultTab = () => {
    if (defaultTab && tabs.find(tab => tab.id === defaultTab && !tab.disabled)) {
      return defaultTab;
    }
    return tabs.find(tab => !tab.disabled)?.id || '';
  };
  
  const [activeTab, setActiveTab] = useState(getValidDefaultTab());

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (!tab.disabled) {
                  setActiveTab(tab.id);
                  // Call onActivate callback when tab is activated
                  if (tab.onActivate && activeTab !== tab.id) {
                    tab.onActivate();
                  }
                }
              }}
              disabled={tab.disabled}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : tab.disabled
                  ? 'border-transparent text-gray-400 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer'
                }
                transition-colors duration-200
              `}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}