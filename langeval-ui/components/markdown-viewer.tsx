"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Mermaid } from './mermaid';
import { cn } from '@/lib/utils';
import { Copy, Check, Info, AlertTriangle, Lightbulb } from 'lucide-react';
import { useState } from 'react';

interface MarkdownViewerProps {
   content: string;
}

// Copy Button Component
const CopyButton = ({ text }: { text: string }) => {
   const [isCopied, setIsCopied] = useState(false);

   const handleCopy = async () => {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
   };

   return (
      <button
         onClick={handleCopy}
         className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-all opacity-0 group-hover:opacity-100 z-10"
         title="Copy code"
      >
         {isCopied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
      </button>
   );
};

export function MarkdownViewer({ content }: MarkdownViewerProps) {
   return (
      <article className="prose prose-slate max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-img:rounded-xl prose-img:shadow-md leading-8 text-slate-600">
         <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
               // --- HEADINGS ---
               h1({ children }) {
                  return (
                     <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8 mt-2 pb-4 border-b border-blue-100 text-blue-950 w-fit">
                        {children}
                     </h1>
                  );
               },
               h2({ children }) {
                  return (
                     <h2 className="text-2xl md:text-3xl font-bold mb-4 mt-12 flex items-center gap-3 text-blue-900 w-fit">
                        <span className="w-1.5 h-8 bg-blue-800 rounded-full inline-block shrink-0"></span>
                        {children}
                     </h2>
                  );
               },
               h3({ children }) {
                  return <h3 className="text-xl md:text-2xl font-bold text-blue-800 mb-3 mt-8">{children}</h3>;
               },

               // --- TEXT & EMPHASIS ---
               p({ children }) {
                  return <p className="mb-6 text-base md:text-[1.05rem] leading-relaxed text-slate-600">{children}</p>;
               },
               strong({ children }) {
                  // Colorful Highlight Effect (Marker Pen style)
                  return (
                     <strong className="font-bold text-slate-900 bg-gradient-to-r from-amber-200/60 to-yellow-200/60 px-1.5 py-0.5 rounded-md mx-0.5 border-b-2 border-amber-300 shadow-sm box-decoration-clone">
                        {children}
                     </strong>
                  );
               },
               em({ children }) {
                  return <em className="italic text-slate-800 font-serif bg-slate-100 px-1 rounded">{children}</em>;
               },
               a({ href, children }) {
                  return (
                     <a href={href} className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 underline decoration-blue-200 underline-offset-4 transition-all hover:decoration-blue-400">
                        {children}
                     </a>
                  );
               },

               // --- LISTS ---
               ul({ children }) {
                  return <ul className="list-none pl-2 mb-6 space-y-3">{children}</ul>;
               },
               ol({ children }) {
                  return <ol className="list-decimal pl-6 mb-6 space-y-3 text-slate-700 font-medium marker:text-indigo-500 marker:font-bold">{children}</ol>;
               },
               li({ children }) {
                  // Custom colorful bullet point
                  if (React.Children.toArray(children)[0]?.toString().startsWith('•')) {
                     return <li className="pl-2">{children}</li>;
                  }
                  return (
                     <li className="relative pl-7 group">
                        <span className="absolute left-0 top-2.5 w-2 h-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full group-hover:scale-125 transition-transform"></span>
                        <span className="text-slate-600 group-hover:text-slate-800 transition-colors">{children}</span>
                     </li>
                  );
               },

               // --- BLOCKQUOTE / CALLOUT ---
               blockquote({ children }) {
                  return (
                     <div className="flex gap-4 p-5 my-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-r-xl shadow-sm text-slate-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                           <Info className="h-24 w-24 text-blue-500" />
                        </div>
                        <div className="shrink-0 mt-1 relative z-10">
                           <Info className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1 italic leading-relaxed text-slate-800 font-medium relative z-10">
                           {children}
                        </div>
                     </div>
                  );
               },

               // --- TABLE ---
               table({ children }) {
                  return (
                     <div className="overflow-x-auto my-10 border border-slate-200 rounded-xl shadow-md bg-white">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">{children}</table>
                     </div>
                  );
               },
               thead({ children }) {
                  return <thead className="bg-gradient-to-r from-slate-50 to-slate-100">{children}</thead>;
               },
               th({ children }) {
                  return <th className="px-6 py-4 text-left text-xs font-bold text-slate-800 uppercase tracking-wider">{children}</th>;
               },
               td({ children }) {
                  return <td className="px-6 py-4 whitespace-nowrap text-slate-600 border-t border-slate-100 group-hover:bg-indigo-50/30 transition-colors">{children}</td>;
               },
               tr({ children }) {
                  return <tr className="group hover:bg-slate-50 transition-colors">{children}</tr>;
               },

               // --- CODE ---
               code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isMermaid = match && match[1] === 'mermaid';
                  const codeString = String(children).replace(/\n$/, '');

                  if (!inline && isMermaid) {
                     return (
                        <div className="my-8 p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex justify-center">
                           <Mermaid chart={codeString} />
                        </div>
                     );
                  }

                  return !inline && match ? (
                     <div className="relative rounded-xl overflow-hidden my-10 border border-slate-800 bg-[#1e1e1e] shadow-2xl group ring-1 ring-white/10">
                        <div className="px-4 py-2.5 bg-[#252526] border-b border-black/30 flex justify-between items-center bg-gradient-to-r from-[#252526] to-[#2d2d30]">
                           <div className="flex items-center gap-2">
                              <div className="flex gap-1.5 mr-2">
                                 <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                                 <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                                 <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                              </div>
                              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">{match[1]}</span>
                           </div>
                        </div>

                        <div className="relative">
                           <CopyButton text={codeString} />
                           <pre className="!bg-[#1e1e1e] !p-5 !m-0 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                              <code className={cn(className, "text-[#d4d4d4] font-mono text-sm leading-7")} {...props}>
                                 {children}
                              </code>
                           </pre>
                        </div>
                     </div>
                  ) : (
                     <code className={cn("bg-gradient-to-r from-violet-50 to-fuchsia-50 text-fuchsia-700 px-1.5 py-0.5 rounded-md font-mono text-[0.9em] border border-fuchsia-100 font-bold mx-0.5 shadow-sm", className)} {...props}>
                        {children}
                     </code>
                  );
               },

               // --- IMAGES ---
               img({ src, alt, ...props }: any) {
                  let finalSrc = src;
                  if (typeof src === 'string' && !src.startsWith('http')) {
                     if (src.startsWith('images/')) {
                        finalSrc = `/docs/${src}`;
                     } else if (src.startsWith('./images/')) {
                        finalSrc = `/docs/${src.substring(2)}`;
                     }
                  }
                  return (
                     <figure className="my-12 group">
                        <div className="overflow-hidden rounded-xl border-4 border-white shadow-2xl bg-slate-100">
                           <img src={finalSrc} alt={alt} {...props} className="max-w-full h-auto mx-auto transform transition-transform duration-700 group-hover:scale-[1.02]" />
                        </div>
                        {alt && <figcaption className="text-center text-sm font-medium text-slate-400 mt-4 italic">{alt}</figcaption>}
                     </figure>
                  );
               },

               // --- HR ---
               hr() {
                  return (
                     <div className="flex items-center gap-4 my-16 opacity-50">
                        <div className="h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent flex-1"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full rotate-45"></div>
                        <div className="h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent flex-1"></div>
                     </div>
                  );
               }
            }}
         >
            {content}
         </ReactMarkdown>
      </article>
   );
}