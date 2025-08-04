import React, { useCallback, useState } from 'react';
import { Button } from './button';
import { Upload, X } from 'lucide-react';

interface DropzoneFallbackProps {
  onDrop: (acceptedFiles: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function DropzoneFallback({
  onDrop,
  accept,
  maxFiles = 1,
  maxSize = 10485760, // 10MB
  disabled = false,
  children
}: DropzoneFallbackProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => {
      if (maxSize && file.size > maxSize) return false;
      if (accept) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const mimeType = file.type;
        const isAccepted = Object.entries(accept).some(([key, values]) => {
          if (key.startsWith('.')) {
            return values.some(ext => ext.toLowerCase() === `.${fileExtension}`);
          }
          return values.some(type => type === mimeType);
        });
        if (!isAccepted) return false;
      }
      return true;
    });

    if (maxFiles && validFiles.length > maxFiles) {
      validFiles.splice(maxFiles);
    }

    setFiles(validFiles);
    onDrop(validFiles);
  }, [onDrop, accept, maxFiles, maxSize, disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      if (maxSize && file.size > maxSize) return false;
      if (accept) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const mimeType = file.type;
        const isAccepted = Object.entries(accept).some(([key, values]) => {
          if (key.startsWith('.')) {
            return values.some(ext => ext.toLowerCase() === `.${fileExtension}`);
          }
          return values.some(type => type === mimeType);
        });
        if (!isAccepted) return false;
      }
      return true;
    });

    if (maxFiles && validFiles.length > maxFiles) {
      validFiles.splice(maxFiles);
    }

    setFiles(validFiles);
    onDrop(validFiles);
  }, [onDrop, accept, maxFiles, maxSize, disabled]);

  const removeFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onDrop(newFiles);
  }, [files, onDrop]);

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple={maxFiles > 1}
          accept={accept ? Object.entries(accept).map(([key, values]) => 
            values.map(v => key.startsWith('.') ? v : v).join(',')
          ).join(',') : undefined}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center space-y-2">
          <Upload className="h-8 w-8 text-gray-400" />
          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600 hover:text-blue-500">
              Cliquez pour sélectionner
            </span>{' '}
            ou glissez-déposez
          </div>
          <p className="text-xs text-gray-500">
            {maxFiles > 1 ? `${maxFiles} fichiers maximum` : '1 fichier maximum'} • {Math.round(maxSize / 1024 / 1024)}MB maximum
          </p>
        </div>
        
        {children}
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700 truncate">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 