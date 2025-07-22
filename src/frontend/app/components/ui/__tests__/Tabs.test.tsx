import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Tabs, { Tab } from '../Tabs';

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
});