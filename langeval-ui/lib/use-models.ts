import { useState, useEffect } from 'react';
import { API_BASE_URL } from './api-utils';

export interface Model {
    id: string;
    name: string;
    provider: string;
    type: string;
    status: string;
}

export function useModels() {
    const [models, setModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_BASE_URL}/resource/models?page_size=100`)
            .then(res => res.json())
            .then(response => {
                let modelsData = [];
                if (Array.isArray(response)) {
                    modelsData = response;
                } else if (response.data && Array.isArray(response.data)) {
                    modelsData = response.data;
                } else if (response.items && Array.isArray(response.items)) {
                    modelsData = response.items;
                }

                if (modelsData && modelsData.length > 0) {
                    setModels(modelsData.sort((a: any, b: any) => a.name.localeCompare(b.name)));
                }
            })
            .catch(err => {
                console.error("[useModels] Failed to fetch models:", err);
            })
            .finally(() => setLoading(false));
    }, []);

    return { models, loading };
}
