'use client';

import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface FileContentViewerProps {
  filePath: string;
  fileName: string;
  projectId: string;
  onClose?: () => void;
}

// Get language for syntax highlighting based on file extension
function getLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'jsx',
    'ts': 'typescript',
    'tsx': 'tsx',
    'json': 'json',
    'md': 'markdown',
    'markdown': 'markdown',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'html': 'html',
    'xml': 'xml',
    'svg': 'xml',
    'yml': 'yaml',
    'yaml': 'yaml',
    'sh': 'bash',
    'bash': 'bash',
    'py': 'python',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'php': 'php',
    'sql': 'sql',
  };
  
  return languageMap[ext || ''] || 'text';
}

export default function FileContentViewer({ 
  filePath, 
  fileName, 
  projectId,
  onClose 
}: FileContentViewerProps) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadFile() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch file content from API
        const response = await fetch(`/api/projects/files?projectId=${projectId}&filePath=${encodeURIComponent(filePath)}`);
        
        if (!response.ok) {
          throw new Error('Failed to load file');
        }
        
        const data = await response.json();
        setContent(data.content || '(File content not available)');
      } catch (err) {
        console.error('Error loading file:', err);
        setError('This file couldn\'t be loaded.');
        setContent('');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadFile();
  }, [filePath, projectId]);
  
  const language = getLanguage(fileName);
  
  return (
    <div className="flex flex-col h-full bg-black/40 rounded-lg border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/30">
        <div className="flex items-center gap-2">
          <span className="text-white/60">📄</span>
          <span className="text-white/90 font-mono text-sm font-semibold">{fileName}</span>
          <span className="text-white/40 text-xs font-mono">{filePath}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white/90 transition-colors"
            title="Close file viewer"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/60">Loading file...</div>
          </div>
        )}
        
        {error && (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <span className="text-3xl mb-2">⚠️</span>
            <div className="text-white/60 text-center">{error}</div>
          </div>
        )}
        
        {!isLoading && !error && content && (
          <div className="text-sm">
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              showLineNumbers={true}
              wrapLines={true}
              customStyle={{
                margin: 0,
                padding: '1rem',
                background: 'transparent',
                fontSize: '0.875rem',
              }}
              codeTagProps={{
                style: {
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                }
              }}
            >
              {content}
            </SyntaxHighlighter>
          </div>
        )}
        
        {!isLoading && !error && !content && (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/40">Empty file</div>
          </div>
        )}
      </div>
      
      {/* Footer Note */}
      <div className="px-4 py-2 border-t border-white/10 bg-black/30">
        <p className="text-xs text-white/40">
          Read-only view • Editing coming soon
        </p>
      </div>
    </div>
  );
}
