import { useState, useEffect } from 'react';
import { apiClient } from './api-client';
import { MOCK_AGENTS } from './mock-data';

export interface Agent {
  id: string;
  name: string;
  type: string;
  status?: string;
  langfuse_project_id?: string;
  langfuse_project_name?: string;
  langfuse_org_id?: string;
  langfuse_org_name?: string;
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // defined in api-client.ts
    // /resource/agents will be prefixed with API_BASE_URL (e.g. /api/v1)
    apiClient('/resource/agents?page_size=100')
      .then(response => {
        // console.log('[useAgents] API response:', response);

        // Handle various response formats:
        // 1. Array: [...]
        // 2. Proxy format: { data: [...] }
        // 3. Backend format: { items: [...] }
        let agentsData: Agent[] = [];
        if (Array.isArray(response)) {
          agentsData = response;
        } else if (response.data && Array.isArray(response.data)) {
          agentsData = response.data;
        } else if (response.items && Array.isArray(response.items)) {
          agentsData = response.items;
        }

        if (agentsData && agentsData.length > 0) {
          // console.log('[useAgents] Using real agents:', agentsData.length);
          // Sort by name for easier selection
          setAgents(agentsData.sort((a, b) => a.name.localeCompare(b.name)));
        } else {
          // console.log('[useAgents] Fallback to mock agents');
          // Only fallback if really no data? Or maybe empty list is valid?
          // If the array is empty, it means no agents in this workspace. 
          // Better to show empty than mock data if API call succeeded.
          setAgents([]);
        }
      })
      .catch(err => {
        console.error("[useAgents] Failed to fetch agents:", err);
        // Fallback to mock data only on error
        setAgents(MOCK_AGENTS);
      })
      .finally(() => setLoading(false));
  }, []);

  return { agents, loading };
}
