import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';

const DOCS_BASE = path.join(process.cwd(), 'docs');

// Helper to get all md files and format them for a specific locale
function getDocsFiles(locale: string) {
   const docsRoot = path.join(DOCS_BASE, locale);
   try {
      if (!fs.existsSync(docsRoot)) return [];
      const files = fs.readdirSync(docsRoot)
         .filter(file => file.endsWith('.md'))
         .sort();

      return files.map(file => {
         const name = file.replace(/\.md$/, '');
         return {
            title: name.replace(/-/g, ' '),
            href: `/docs/${name}`
         };
      });
   } catch (e) {
      console.error(`Error reading docs directory for locale: ${locale}`, e);
      return [];
   }
}

// Helper to get recursive markdown files from a subdirectory for a specific locale
function getRecursiveDocs(locale: string, subDir: string, baseHref: string) {
   const dirPath = path.join(DOCS_BASE, locale, subDir);
   if (!fs.existsSync(dirPath)) return [];

   let results: { title: string; href: string }[] = [];

   function traverse(currentDir: string, relativePath: string) {
      const files = fs.readdirSync(currentDir);

      for (const file of files) {
         const fullPath = path.join(currentDir, file);
         const stat = fs.statSync(fullPath);

         if (stat.isDirectory()) {
            if (file === 'images') continue; // Skip images folder
            traverse(fullPath, path.join(relativePath, file));
         } else if (file.endsWith('.md')) {
            const name = file.replace(/\.md$/, '');
            // Create a readable title: "SubFolder: File Name"
            const dirPrefix = relativePath ? relativePath.split('/').map(s => s.replace(/-/g, ' ')).join(' / ') + ': ' : '';
            const cleanName = name.replace(/-/g, ' ');

            results.push({
               title: dirPrefix + cleanName,
               href: `/docs/${baseHref}/${relativePath ? relativePath + '/' : ''}${name}`
            });
         }
      }
   }

   try {
      traverse(dirPath, '');
      // Sort by title for consistency
      return results.sort((a, b) => a.title.localeCompare(b.title));
   } catch (e) {
      console.error(`Error reading ${subDir} directory for locale: ${locale}`, e);
      return [];
   }
}

// Because we need interactivity (collapsible sidebar), we'll separate the client logic.
import { DocsClientLayout } from './docs-client-layout';

export default async function DocsPage({ params }: { params: Promise<{ locale: string; slug?: string[] }> }) {
   const { locale, slug } = await params;
   const rootDocs = getDocsFiles(locale);
   const metricsDocs = getRecursiveDocs(locale, 'metrics', 'metrics');

   // Group docs effectively
   const docGroups = [
      {
         title: locale === 'vi' ? "Tài liệu dự án" : "Project Documentation",
         items: rootDocs
      },
      {
         title: locale === 'vi' ? "Metrics & Đánh giá" : "Metrics & Evaluation",
         items: metricsDocs
      }
   ];

   // Determine current file
   let currentFile = '00-Master-Plan.md';
   if (slug && slug.length > 0) {
      currentFile = slug.join('/');
      // Security check: prevent directory traversal
      if (currentFile.includes('..')) return notFound();
   }

   // Ensure extension
   if (!currentFile.endsWith('.md')) {
      currentFile += '.md';
   }

   const filePath = path.join(DOCS_BASE, locale, currentFile);

   if (!fs.existsSync(filePath)) {
      return notFound();
   }

   const content = fs.readFileSync(filePath, 'utf-8');

   return (
      <DocsClientLayout
         content={content}
         slug={slug}
         docGroups={docGroups}
      />
   );
}


