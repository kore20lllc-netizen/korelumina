'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { getFilePathsFromTree, type FileNode } from '@/lib/parseFileTree';

interface QuickSearchProps {
  isOpen: boolean;
  onClose: () => void;
  fileTree: FileNode | null;
  onFileSelect: (filePath: string, fileName: string) => void;
}

export default function QuickSearch({ 
  isOpen, 
  onClose, 
  fileTree, 
  onFileSelect 
}: QuickSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get all file paths from tree using useMemo
  const allFiles = useMemo(() => {
    return fileTree ? getFilePathsFromTree(fileTree) : [];
  }, [fileTree]);
  
  // Filter files based on search query using useMemo
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) {
      return allFiles;
    }
    
    const query = searchQuery.toLowerCase();
    return allFiles.filter(file => 
      file.toLowerCase().includes(query)
    );
  }, [searchQuery, allFiles]);
  
  // Reset search and selection when modal opens
  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to defer state updates to next tick
      setTimeout(() => {
        setSearchQuery('');
        setSelectedIndex(0);
      }, 0);
    }
  }, [isOpen]);
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          Math.min(prev + 1, filteredFiles.length - 1)
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredFiles[selectedIndex]) {
        e.preventDefault();
        const filePath = filteredFiles[selectedIndex];
        const fileName = filePath.split('/').pop() || filePath;
        onFileSelect(filePath, fileName);
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredFiles, selectedIndex, onFileSelect, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl mx-4 bg-gray-900 rounded-lg shadow-2xl border border-white/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files…"
              className="w-full px-4 py-3 bg-black/40 text-white placeholder-white/40 rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              aria-label="Search files by name"
            />
          </div>
          <div className="mt-2 text-xs text-white/40 flex items-center justify-between">
            <span>Type to filter files</span>
            <span>↑↓ navigate • Enter select • Esc close</span>
          </div>
        </div>
        
        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filteredFiles.length === 0 ? (
            <div className="p-8 text-center text-white/40">
              {searchQuery ? 'No files found matching your search' : 'No files available'}
            </div>
          ) : (
            <div>
              {filteredFiles.map((filePath, index) => {
                const fileName = filePath.split('/').pop() || filePath;
                const isSelected = index === selectedIndex;
                
                return (
                  <button
                    key={filePath}
                    onClick={() => {
                      onFileSelect(filePath, fileName);
                      onClose();
                    }}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                      isSelected 
                        ? 'bg-blue-500/20 border-l-2 border-blue-400' 
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="text-white/60">📄</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-mono ${
                        isSelected ? 'text-blue-300 font-semibold' : 'text-white/80'
                      }`}>
                        {fileName}
                      </div>
                      <div className="text-xs text-white/40 truncate">
                        {filePath}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {filteredFiles.length > 0 && (
          <div className="px-4 py-2 border-t border-white/10 bg-black/30">
            <p className="text-xs text-white/40">
              {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
