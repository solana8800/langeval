
"use client";

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif',
});

interface MermaidProps {
  chart: string;
}

export const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (isMounted) {
          setSvg(svg);
        }
      } catch (error) {
        console.error("Mermaid render error:", error);
      }
    };

    if (chart) {
       renderChart();
    }

    return () => {
      isMounted = false;
    };
  }, [chart]);

  return (
    <div className="flex justify-center py-8 bg-white rounded-lg my-10 border border-slate-200 shadow-sm overflow-hidden group relative hover:shadow-md transition-shadow">
       <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100/80 p-1 rounded">
          <span className="text-xs text-slate-500 font-mono">Mermaid Chart</span>
       </div>
       {svg ? (
          <div 
            className="w-full overflow-x-auto flex justify-center p-4 [&>svg]:max-w-none [&>svg]:w-full [&>svg]:h-auto [&>svg]:min-w-[800px]"
            dangerouslySetInnerHTML={{ __html: svg }} 
          />
       ) : (
          <div className="text-sm text-slate-400 animate-pulse p-10">Loading diagram...</div>
       )}
    </div>
  );
};
