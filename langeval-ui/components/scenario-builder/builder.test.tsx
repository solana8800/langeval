import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ScenarioBuilder } from './builder';

// Mock API_BASE_URL
jest.mock('@/lib/api-utils', () => ({
  API_BASE_URL: '/api/v1'
}));

// Mock ReactFlow
jest.mock('reactflow', () => {
  const ReactFlow = ({ children }: any) => <div data-testid="react-flow">{children}</div>;
  return {
    __esModule: true,
    default: ReactFlow,
    MiniMap: () => <div data-testid="minimap" />,
    Controls: () => <div data-testid="controls" />,
    Background: () => <div data-testid="background" />,
    useNodesState: (initial: any) => React.useState(initial),
    useEdgesState: (initial: any) => React.useState(initial),
    BackgroundVariant: { Dots: 'dots' },
  };
});

// Mock NodeConfigPanel
jest.mock('./node-config-panel', () => ({
  NodeConfigPanel: () => <div data-testid="node-config-panel" />
}));

global.fetch = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('ScenarioBuilder', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<ScenarioBuilder />);
    expect(screen.getByText('Loading Scenario...')).toBeInTheDocument();
  });

  it('renders ReactFlow after fetching data', async () => {
    const mockData = {
      data: {
        nodes: [{ id: '1', data: { label: 'Test Node' }, position: { x: 0, y: 0 } }],
        edges: []
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockData
    });

    render(<ScenarioBuilder />);

    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      expect(screen.queryByText('Loading Scenario...')).not.toBeInTheDocument();
    });
  });

  it('handles fetch error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<ScenarioBuilder />);

    await waitFor(() => {
      // Loading should finish
      expect(screen.queryByText('Loading Scenario...')).not.toBeInTheDocument();
      // Should still render ReactFlow (empty)
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
