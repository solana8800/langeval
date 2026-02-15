import { useState, useEffect } from 'react';
import { API_BASE_URL } from './api-utils';
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
    fetch(`${API_BASE_URL}/resource/agents?page_size=100`)
      .then(res => res.json())
      .then(response => {
        console.log('[useAgents] API response:', response);

        // Handle various response formats:
        // 1. Array: [...]
        // 2. Proxy format: { data: [...] }
        // 3. Backend format: { items: [...] }
        let agentsData = [];
        if (Array.isArray(response)) {
          agentsData = response;
        } else if (response.data && Array.isArray(response.data)) {
          agentsData = response.data;
        } else if (response.items && Array.isArray(response.items)) {
          agentsData = response.items;
        }

        if (agentsData && agentsData.length > 0) {
          console.log('[useAgents] Using real agents:', agentsData.length);
          // Sort by name for easier selection
          setAgents(agentsData.sort((a: any, b: any) => a.name.localeCompare(b.name)));
        } else {
          console.log('[useAgents] Fallback to mock agents');
          setAgents(MOCK_AGENTS);
        }
      })
      .catch(err => {
        console.error("[useAgents] Failed to fetch agents:", err);
        setAgents(MOCK_AGENTS);
      })
      .finally(() => setLoading(false));
  }, []);

  return { agents, loading };
}
