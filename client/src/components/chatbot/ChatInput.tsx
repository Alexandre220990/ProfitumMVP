import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { ChatSuggestions } from "./ChatSuggestions";

export function ChatInput({ onSend, disabled, loading, onSuggestion }: { onSend: (text: string) => void; disabled?: boolean; loading?: boolean; onSuggestion: (text: string) => void }) {
  const [value, setValue] = useState("");
  const handleSend = () => {
    if (value.trim()) {
      onSend(value);
      setValue("");
    }
  };
  return (
    <div className="p-4 bg-white rounded-b-xl border-t flex flex-col gap-2">
      <ChatSuggestions onSelect={onSuggestion} />
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Écrivez votre message…"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          disabled={disabled || loading}
        />
        <Button onClick={handleSend} disabled={disabled || loading} variant="default" className="rounded-full px-4">
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
} 