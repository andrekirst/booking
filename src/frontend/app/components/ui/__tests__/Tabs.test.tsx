import React from 'react';
import { render, screen } from '@testing-library/react';
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
  }
];

describe('Tabs Component', () => {
  it('renders without crashing', () => {
    render(<Tabs tabs={mockTabs} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('renders all tabs', () => {
    render(<Tabs tabs={mockTabs} />);
    expect(screen.getByText('Erster Tab')).toBeInTheDocument();
    expect(screen.getByText('Zweiter Tab')).toBeInTheDocument();
  });

  it('shows first tab content by default', () => {
    render(<Tabs tabs={mockTabs} />);
    expect(screen.getByText('Inhalt des ersten Tabs')).toBeInTheDocument();
  });
});