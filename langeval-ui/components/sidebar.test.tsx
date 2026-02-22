import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Sidebar } from './sidebar';

// Mock API_BASE_URL
jest.mock('@/lib/api-utils', () => ({
  API_BASE_URL: '/api/v1'
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Menu: () => <div data-testid="menu-icon" />,
  BookOpen: () => <div />,
  LayoutDashboard: () => <div />,
  BarChart3: () => <div />,
  Terminal: () => <div />,
  Activity: () => <div />,
  GitBranch: () => <div />,
  BrainCircuit: () => <div />,
  Target: () => <div />,
  Users: () => <div />,
  ShieldCheck: () => <div />,
  Webhook: () => <div />,
  FileCode: () => <div />,
  Zap: () => <div />,
  Settings: () => <div />,
}));

global.fetch = jest.fn();

describe('Sidebar', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    // Mock fetch to never resolve immediately or resolve slowly
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<Sidebar />);
    
    // Check for skeleton loading (using class checks or structure)
    // The skeleton has animate-pulse class
    const skeletons = document.getElementsByClassName('animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders navigation items after fetching data', async () => {
    const mockData = {
      data: [
        {
          title: "Test Group",
          items: [
            {
              name: "Test Item",
              href: "/test",
              icon: "Activity",
              description: "Test Description"
            }
          ]
        }
      ]
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockData
    });

    render(<Sidebar />);

    await waitFor(() => {
      expect(screen.getByText('Test Group')).toBeInTheDocument();
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });
  });

  it('handles fetch error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<Sidebar />);

    await waitFor(() => {
      // Should eventually stop loading. 
      // Current implementation hides loading on finally.
      // And renders empty nav content if data is empty.
      
      // Check if the main content is rendered (e.g. the header "Evaluation")
      expect(screen.getByText('Evaluation')).toBeInTheDocument();
      
      // Check if loading skeleton is gone
      const skeletons = document.getElementsByClassName('animate-pulse');
      expect(skeletons.length).toBe(0);
    });

    consoleSpy.mockRestore();
  });
});
