import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, Smile, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// COMPOSANT MESSAGE INPUT
// ============================================================================

interface MessageInputProps {
  onSendMessage: (content: string, files?: File[]) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  sending?: boolean;
  placeholder?: string;
  className?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
  sending = false,
  placeholder = "Tapez votre message...",
  className = ""
}) => {
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ========================================
  // GESTION DE LA FRAPPE
  // ========================================

  const handleTyping = useCallback((value: string) => {
    setMessage(value);
    
    if (!isTyping) {
      setIsTyping(true);
      onTyping?.(true);
    }

    // Nettoyer le timeout précédent
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Arrêter la frappe après 2 secondes d'inactivité
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping?.(false);
    }, 2000);
  }, [isTyping, onTyping]);

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // ========================================
  // GESTION DE L'ENVOI
  // ========================================

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() && selectedFiles.length === 0) return;
    if (disabled || sending) return;

    try {
      await onSendMessage(message.trim(), selectedFiles);
      setMessage('');
      setSelectedFiles([]);
      setIsTyping(false);
      onTyping?.(false);
      
      // Remettre le focus sur le textarea
      textareaRef.current?.focus();
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
    }
  }, [message, selectedFiles, disabled, sending, onSendMessage, onTyping]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // ========================================
  // GESTION DES FICHIERS
  // ========================================

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
    // Réinitialiser l'input pour permettre la sélection du même fichier
    e.target.value = '';
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ========================================
  // RENDU DES FICHIERS SÉLECTIONNÉS
  // ========================================

  const renderSelectedFiles = () => {
    if (selectedFiles.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg border">
        {selectedFiles.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="flex items-center gap-2 bg-white px-2 py-1 rounded border text-xs"
          >
            <span className="truncate max-w-32">{file.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-red-100"
              onClick={() => removeFile(index)}
            >
              <X className="w-3 h-3 text-red-500" />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  const canSend = message.trim().length > 0 || selectedFiles.length > 0;
  const isDisabled = disabled || sending || !canSend;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Fichiers sélectionnés */}
      {renderSelectedFiles()}

      {/* Zone de saisie */}
      <div className="flex items-end gap-2">
        {/* Bouton fichier */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 flex-shrink-0"
          onClick={openFileSelector}
          disabled={disabled}
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        {/* Input de message */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[40px] max-h-32 resize-none pr-12"
            rows={1}
          />
          
          {/* Bouton emoji (placeholder pour l'instant) */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 bottom-1 h-6 w-6"
            disabled={disabled}
          >
            <Smile className="w-3 h-3" />
          </Button>
        </div>

        {/* Bouton envoi */}
        <Button
          type="button"
          size="icon"
          className="h-10 w-10 flex-shrink-0"
          onClick={handleSendMessage}
          disabled={isDisabled}
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Input fichier caché */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
      />
    </div>
  );
}; 