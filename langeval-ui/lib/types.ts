
export interface BattleCampaign {
    id: string;
    mode: 'adversarial' | 'comparison';
    status: 'running' | 'completed' | 'failed' | 'queued';
    created_at: string;
    updated_at?: string;

    // Adversarial specific
    target_agent_id?: string;
    simulator_id?: string;
    score_sum?: number;

    // Comparison specific
    agent_a_id?: string;
    agent_b_id?: string;
    agent_a_wins?: number;
    agent_b_wins?: number;
    ties?: number;

    current_turn: number;
    max_turns: number;
    progress?: number; // Calculated or from backend
}

export interface Page<T> {
    items: T[];
    total: number;
    page: number;
    size: number;
    pages: number;
}
