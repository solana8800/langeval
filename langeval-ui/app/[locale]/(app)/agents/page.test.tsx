import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AgentsPage from './page';

// Mock API_BASE_URL
jest.mock('@/lib/api-utils', () => ({
  API_BASE_URL: '/api/v1'
}));

global.fetch = jest.fn();

describe('AgentsPage', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<AgentsPage />);
    expect(screen.getByText('Đang tải danh sách agent...')).toBeInTheDocument();
  });

  it('renders agent list after fetch', async () => {
    const mockAgents = [
      {
        id: '1',
        name: 'Test Agent',
        type: 'Chatbot',
        repoUrl: 'http://repo.url',
        version: 'v1',
        status: 'active'
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ data: mockAgents })
    });

    render(<AgentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
      expect(screen.getByText('Chatbot')).toBeInTheDocument();
    });
  });

  it('handles adding new agent', async () => {
    const mockAgents = [
      { id: '1', name: 'Existing Agent', type: 'Chatbot', status: 'active' }
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({ data: mockAgents })
      })
      .mockResolvedValueOnce({
        json: async () => ({ 
          success: true, 
          data: { id: '2', name: 'New Agent', type: 'Chatbot', status: 'active', version: 'v0.0.1' } 
        })
      });

    render(<AgentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Existing Agent')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Thêm Agent Mới');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('New Agent')).toBeInTheDocument();
    });
  });
});
