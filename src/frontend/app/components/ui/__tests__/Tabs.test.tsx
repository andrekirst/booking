import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import Tabs, { Tab } from '../Tabs';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

const mockTabs: Tab[] = [
  {
    id: 'tab1',
    label: 'Erster Tab',
    content: <div>Inhalt des ersten Tabs</div>
  },
  {
    id: 'tab2',
    label: 'Zweiter Tab',
    content: <div>Inhalt des zweiten Tabs</div>
  },
  {
    id: 'tab3',
    label: 'Dritter Tab',
    content: <div>Inhalt des dritten Tabs</div>
  }
];

const mockTabsWithDisabled: Tab[] = [
  {
    id: 'tab1',
    label: 'Erster Tab',
    content: <div>Inhalt des ersten Tabs</div>
  },
  {
    id: 'tab2',
    label: 'Zweiter Tab',
    content: <div>Inhalt des zweiten Tabs</div>,
    disabled: true
  },
  {
    id: 'tab3',
    label: 'Dritter Tab',
    content: <div>Inhalt des dritten Tabs</div>
  }
];

describe('Tabs', () => {
  describe('Rendering', () => {
    it('rendert alle Tab-Label korrekt', () => {
      render(<Tabs tabs={mockTabs} />);
      
      expect(screen.getByText('Erster Tab')).toBeInTheDocument();
      expect(screen.getByText('Zweiter Tab')).toBeInTheDocument();
      expect(screen.getByText('Dritter Tab')).toBeInTheDocument();
    });

    it('zeigt den ersten Tab als aktiv standardmäßig', () => {
      render(<Tabs tabs={mockTabs} />);
      
      const firstTab = screen.getByText('Erster Tab');
      expect(firstTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(firstTab).toHaveAttribute('aria-current', 'page');
    });

    it('zeigt den Inhalt des ersten Tabs standardmäßig', () => {
      render(<Tabs tabs={mockTabs} />);
      
      expect(screen.getByText('Inhalt des ersten Tabs')).toBeInTheDocument();
      expect(screen.queryByText('Inhalt des zweiten Tabs')).not.toBeInTheDocument();
    });

    it('rendert nichts wenn keine Tabs vorhanden sind', () => {
      const { container } = render(<Tabs tabs={[]} />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Default Tab', () => {
    it('zeigt den spezifizierten Standard-Tab als aktiv', () => {
      render(<Tabs tabs={mockTabs} defaultTab="tab2" />);
      
      const secondTab = screen.getByText('Zweiter Tab');
      expect(secondTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(secondTab).toHaveAttribute('aria-current', 'page');
    });

    it('zeigt den Inhalt des Standard-Tabs', () => {
      render(<Tabs tabs={mockTabs} defaultTab="tab2" />);
      
      expect(screen.getByText('Inhalt des zweiten Tabs')).toBeInTheDocument();
      expect(screen.queryByText('Inhalt des ersten Tabs')).not.toBeInTheDocument();
    });

    it('verwendet den ersten Tab wenn ungültiger Standard-Tab angegeben wird', () => {
      render(<Tabs tabs={mockTabs} defaultTab="invalid-tab" />);
      
      const firstTab = screen.getByText('Erster Tab');
      expect(firstTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(screen.getByText('Inhalt des ersten Tabs')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('wechselt zu einem anderen Tab beim Klick', () => {
      render(<Tabs tabs={mockTabs} />);
      
      const secondTab = screen.getByText('Zweiter Tab');
      fireEvent.click(secondTab);
      
      expect(secondTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(secondTab).toHaveAttribute('aria-current', 'page');
      expect(screen.getByText('Inhalt des zweiten Tabs')).toBeInTheDocument();
      expect(screen.queryByText('Inhalt des ersten Tabs')).not.toBeInTheDocument();
    });

    it('deaktiviert den vorherigen Tab beim Wechsel', () => {
      render(<Tabs tabs={mockTabs} />);
      
      const firstTab = screen.getByText('Erster Tab');
      const secondTab = screen.getByText('Zweiter Tab');
      
      fireEvent.click(secondTab);
      
      expect(firstTab).toHaveClass('border-transparent', 'text-gray-500');
      expect(firstTab).not.toHaveAttribute('aria-current');
    });

    it('kann zwischen mehreren Tabs wechseln', () => {
      render(<Tabs tabs={mockTabs} />);
      
      // Zum zweiten Tab wechseln
      fireEvent.click(screen.getByText('Zweiter Tab'));
      expect(screen.getByText('Inhalt des zweiten Tabs')).toBeInTheDocument();
      
      // Zum dritten Tab wechseln
      fireEvent.click(screen.getByText('Dritter Tab'));
      expect(screen.getByText('Inhalt des dritten Tabs')).toBeInTheDocument();
      expect(screen.queryByText('Inhalt des zweiten Tabs')).not.toBeInTheDocument();
      
      // Zurück zum ersten Tab
      fireEvent.click(screen.getByText('Erster Tab'));
      expect(screen.getByText('Inhalt des ersten Tabs')).toBeInTheDocument();
      expect(screen.queryByText('Inhalt des dritten Tabs')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('hat die korrekte ARIA-Navigation', () => {
      render(<Tabs tabs={mockTabs} />);
      
      const navigation = screen.getByLabelText('Tabs');
      expect(navigation).toBeInTheDocument();
    });

    it('markiert nur den aktiven Tab mit aria-current', () => {
      render(<Tabs tabs={mockTabs} />);
      
      const firstTab = screen.getByText('Erster Tab');
      const secondTab = screen.getByText('Zweiter Tab');
      const thirdTab = screen.getByText('Dritter Tab');
      
      expect(firstTab).toHaveAttribute('aria-current', 'page');
      expect(secondTab).not.toHaveAttribute('aria-current');
      expect(thirdTab).not.toHaveAttribute('aria-current');
    });
  });

  describe('Styling', () => {
    it('wendet aktive Styles nur auf den aktiven Tab an', () => {
      render(<Tabs tabs={mockTabs} />);
      
      const firstTab = screen.getByText('Erster Tab');
      const secondTab = screen.getByText('Zweiter Tab');
      
      expect(firstTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(secondTab).toHaveClass('border-transparent', 'text-gray-500');
    });

    it('wendet Hover-Styles auf inaktive Tabs an', () => {
      render(<Tabs tabs={mockTabs} />);
      
      const secondTab = screen.getByText('Zweiter Tab');
      expect(secondTab).toHaveClass('hover:text-gray-700', 'hover:border-gray-300');
    });

    it('hat Transition-Animationen', () => {
      render(<Tabs tabs={mockTabs} />);
      
      const tabs = screen.getAllByRole('button');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('transition-colors', 'duration-200');
      });
    });
  });

  describe('Disabled Tabs', () => {
    it('rendert deaktivierte Tabs mit disabled-Attribut', () => {
      render(<Tabs tabs={mockTabsWithDisabled} />);
      
      const disabledTab = screen.getByText('Zweiter Tab');
      expect(disabledTab).toBeDisabled();
    });

    it('wendet disabled-Styles auf deaktivierte Tabs an', () => {
      render(<Tabs tabs={mockTabsWithDisabled} />);
      
      const disabledTab = screen.getByText('Zweiter Tab');
      expect(disabledTab).toHaveClass('text-gray-400', 'cursor-not-allowed');
    });

    it('verhindert Klicks auf deaktivierte Tabs', () => {
      render(<Tabs tabs={mockTabsWithDisabled} />);
      
      const firstTab = screen.getByText('Erster Tab');
      const disabledTab = screen.getByText('Zweiter Tab');
      
      // Erster Tab sollte aktiv sein
      expect(firstTab).toHaveClass('border-blue-500', 'text-blue-600');
      
      // Klick auf deaktiverten Tab sollte nichts ändern
      fireEvent.click(disabledTab);
      
      // Erster Tab sollte immer noch aktiv sein
      expect(firstTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(screen.getByText('Inhalt des ersten Tabs')).toBeInTheDocument();
      expect(screen.queryByText('Inhalt des zweiten Tabs')).not.toBeInTheDocument();
    });

    it('überspringt deaktivierte Tabs bei der Standard-Tab-Auswahl', () => {
      const tabsWithFirstDisabled: Tab[] = [
        {
          id: 'tab1',
          label: 'Erster Tab',
          content: <div>Inhalt des ersten Tabs</div>,
          disabled: true
        },
        {
          id: 'tab2',
          label: 'Zweiter Tab',
          content: <div>Inhalt des zweiten Tabs</div>
        }
      ];

      render(<Tabs tabs={tabsWithFirstDisabled} />);
      
      // Zweiter Tab sollte aktiv sein, da der erste deaktiviert ist
      const secondTab = screen.getByText('Zweiter Tab');
      expect(secondTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(screen.getByText('Inhalt des zweiten Tabs')).toBeInTheDocument();
    });

    it('verwendet ersten nicht-deaktivierten Tab wenn Standard-Tab deaktiviert ist', () => {
      render(<Tabs tabs={mockTabsWithDisabled} defaultTab="tab2" />);
      
      // Erster Tab sollte aktiv sein, da der Standard-Tab deaktiviert ist
      const firstTab = screen.getByText('Erster Tab');
      expect(firstTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(screen.getByText('Inhalt des ersten Tabs')).toBeInTheDocument();
    });
  });

  describe('onActivate Callback', () => {
    it('should call onActivate when tab is first activated', () => {
      const onActivateTab1 = jest.fn();
      const onActivateTab2 = jest.fn();
      
      const tabsWithCallbacks: Tab[] = [
        {
          id: 'tab1',
          label: 'Erster Tab',
          content: <div>Inhalt des ersten Tabs</div>,
          onActivate: onActivateTab1
        },
        {
          id: 'tab2',
          label: 'Zweiter Tab',
          content: <div>Inhalt des zweiten Tabs</div>,
          onActivate: onActivateTab2
        }
      ];

      render(<Tabs tabs={tabsWithCallbacks} />);
      
      // First tab should not call onActivate on initial render
      expect(onActivateTab1).not.toHaveBeenCalled();
      
      // Click second tab should call its onActivate
      fireEvent.click(screen.getByText('Zweiter Tab'));
      expect(onActivateTab2).toHaveBeenCalledTimes(1);
      
      // Click first tab should call its onActivate
      fireEvent.click(screen.getByText('Erster Tab'));
      expect(onActivateTab1).toHaveBeenCalledTimes(1);
    });

    it('should not call onActivate when clicking already active tab', () => {
      const onActivateTab1 = jest.fn();
      
      const tabsWithCallback: Tab[] = [
        {
          id: 'tab1',
          label: 'Erster Tab',
          content: <div>Inhalt des ersten Tabs</div>,
          onActivate: onActivateTab1
        },
        {
          id: 'tab2',
          label: 'Zweiter Tab',
          content: <div>Inhalt des zweiten Tabs</div>
        }
      ];

      render(<Tabs tabs={tabsWithCallback} />);
      
      // Click active tab should not call onActivate
      fireEvent.click(screen.getByText('Erster Tab'));
      expect(onActivateTab1).not.toHaveBeenCalled();
      
      // Switch to second tab and back
      fireEvent.click(screen.getByText('Zweiter Tab'));
      fireEvent.click(screen.getByText('Erster Tab'));
      expect(onActivateTab1).toHaveBeenCalledTimes(1);
      
      // Click active tab again should not call onActivate
      fireEvent.click(screen.getByText('Erster Tab'));
      expect(onActivateTab1).toHaveBeenCalledTimes(1);
    });

    it('should not call onActivate for disabled tabs', () => {
      const onActivateDisabled = jest.fn();
      
      const tabsWithDisabledCallback: Tab[] = [
        {
          id: 'tab1',
          label: 'Erster Tab',
          content: <div>Inhalt des ersten Tabs</div>
        },
        {
          id: 'tab2',
          label: 'Zweiter Tab (Disabled)',
          content: <div>Inhalt des zweiten Tabs</div>,
          disabled: true,
          onActivate: onActivateDisabled
        }
      ];

      render(<Tabs tabs={tabsWithDisabledCallback} />);
      
      fireEvent.click(screen.getByText('Zweiter Tab (Disabled)'));
      expect(onActivateDisabled).not.toHaveBeenCalled();
    });

    it('should support lazy loading pattern with onActivate', async () => {
      const loadHistoryData = jest.fn().mockResolvedValue(['item1', 'item2']);
      
      const LazyContent = ({ data }: { data: string[] }) => (
        <div>
          {data.length === 0 ? 'Loading...' : data.map(item => <div key={item}>{item}</div>)}
        </div>
      );

      const LazyTabContent = () => {
        const [data, setData] = React.useState<string[]>([]);
        
        const loadData = async () => {
          const result = await loadHistoryData();
          setData(result);
        };

        return { content: <LazyContent data={data} />, loadData };
      };

      const { content: lazyContent, loadData } = LazyTabContent();
      
      const tabsWithLazyLoading: Tab[] = [
        {
          id: 'details',
          label: 'Details',
          content: <div>Details Content</div>
        },
        {
          id: 'history',
          label: 'Historie',
          content: lazyContent,
          onActivate: loadData
        }
      ];

      render(<Tabs tabs={tabsWithLazyLoading} />);
      
      // Initially should show loading
      expect(screen.getByText('Details Content')).toBeInTheDocument();
      
      // Click history tab
      fireEvent.click(screen.getByText('Historie'));
      
      // Should call lazy loading function
      expect(loadHistoryData).toHaveBeenCalledTimes(1);
      
      // Should initially show loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      // Wait for lazy loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      
      // Should show loaded data
      expect(screen.getByText('item1')).toBeInTheDocument();
      expect(screen.getByText('item2')).toBeInTheDocument();
    });

    it('should handle async onActivate callbacks without blocking UI', async () => {
      const asyncCallback = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      const tabsWithAsync: Tab[] = [
        {
          id: 'tab1',
          label: 'Sync Tab',
          content: <div>Sync Content</div>
        },
        {
          id: 'tab2',
          label: 'Async Tab',
          content: <div>Async Content</div>,
          onActivate: asyncCallback
        }
      ];

      render(<Tabs tabs={tabsWithAsync} />);
      
      // Click async tab
      fireEvent.click(screen.getByText('Async Tab'));
      
      // UI should update immediately (not blocked by async operation)
      expect(screen.getByText('Async Content')).toBeInTheDocument();
      
      // Async callback should be called
      expect(asyncCallback).toHaveBeenCalledTimes(1);
      
      // Wait for async operation to complete
      await waitFor(() => {
        expect(asyncCallback).toHaveResolvedTimes(1);
      }, { timeout: 200 });
    });

    it('should handle onActivate callback errors gracefully', () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const tabsWithError: Tab[] = [
        {
          id: 'tab1',
          label: 'Normal Tab',
          content: <div>Normal Content</div>
        },
        {
          id: 'tab2',
          label: 'Error Tab',
          content: <div>Error Content</div>,
          onActivate: errorCallback
        }
      ];

      render(<Tabs tabs={tabsWithError} />);
      
      // Should not crash when callback throws error
      expect(() => {
        fireEvent.click(screen.getByText('Error Tab'));
      }).not.toThrow();
      
      // Tab should still activate despite error
      expect(screen.getByText('Error Content')).toBeInTheDocument();
      expect(errorCallback).toHaveBeenCalledTimes(1);
      
      // Restore console.error
      consoleSpy.mockRestore();
    });
  });

  describe('Advanced Accessibility Tests', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Tabs tabs={mockTabs} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with disabled tabs', async () => {
      const { container } = render(<Tabs tabs={mockTabsWithDisabled} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', () => {
      render(<Tabs tabs={mockTabs} />);
      
      const firstTab = screen.getByText('Erster Tab');
      const secondTab = screen.getByText('Zweiter Tab');
      
      // First tab should be focusable
      firstTab.focus();
      expect(firstTab).toHaveFocus();
      
      // Tab key should move to next tab
      fireEvent.keyDown(firstTab, { key: 'Tab' });
      // Note: In real browser, this would move focus, but jsdom doesn't simulate this
      // We can test that tabs are in the tab order by checking tabIndex
      expect(firstTab).not.toHaveAttribute('tabIndex', '-1');
      expect(secondTab).not.toHaveAttribute('tabIndex', '-1');
    });

    it('should announce tab changes to screen readers', () => {
      render(<Tabs tabs={mockTabs} />);
      
      const firstTab = screen.getByText('Erster Tab');
      const secondTab = screen.getByText('Zweiter Tab');
      
      // Initially first tab should have aria-current
      expect(firstTab).toHaveAttribute('aria-current', 'page');
      expect(secondTab).not.toHaveAttribute('aria-current');
      
      // After clicking second tab
      fireEvent.click(secondTab);
      expect(firstTab).not.toHaveAttribute('aria-current');
      expect(secondTab).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle tabs with undefined onActivate gracefully', () => {
      const tabsWithUndefinedCallback: Tab[] = [
        {
          id: 'tab1',
          label: 'Tab 1',
          content: <div>Content 1</div>,
          onActivate: undefined
        },
        {
          id: 'tab2',
          label: 'Tab 2',
          content: <div>Content 2</div>
          // onActivate not defined
        }
      ];

      render(<Tabs tabs={tabsWithUndefinedCallback} />);
      
      // Should not crash when switching tabs
      expect(() => {
        fireEvent.click(screen.getByText('Tab 2'));
        fireEvent.click(screen.getByText('Tab 1'));
      }).not.toThrow();
    });

    it('should handle rapid tab switching correctly', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      const rapidTabs: Tab[] = [
        {
          id: 'tab1',
          label: 'Tab 1',
          content: <div>Content 1</div>,
          onActivate: callback1
        },
        {
          id: 'tab2',
          label: 'Tab 2',
          content: <div>Content 2</div>,
          onActivate: callback2
        }
      ];

      render(<Tabs tabs={rapidTabs} />);
      
      // Rapid clicking
      fireEvent.click(screen.getByText('Tab 2'));
      fireEvent.click(screen.getByText('Tab 1'));
      fireEvent.click(screen.getByText('Tab 2'));
      fireEvent.click(screen.getByText('Tab 1'));
      
      // Each unique activation should call callback
      expect(callback1).toHaveBeenCalledTimes(2);
      expect(callback2).toHaveBeenCalledTimes(2);
      
      // Final state should be correct
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    });

    it('should handle empty content gracefully', () => {
      const tabsWithEmptyContent: Tab[] = [
        {
          id: 'tab1',
          label: 'Empty Tab',
          content: null
        },
        {
          id: 'tab2',
          label: 'Undefined Tab',
          content: undefined as any
        }
      ];

      render(<Tabs tabs={tabsWithEmptyContent} />);
      
      // Should not crash
      expect(screen.getByText('Empty Tab')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Undefined Tab'));
      expect(screen.getByText('Undefined Tab')).toHaveClass('border-blue-500');
    });
  });
});