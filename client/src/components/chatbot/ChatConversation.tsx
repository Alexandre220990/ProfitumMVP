import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";

export function ChatConversation({ messages }: { messages: { text: string; isUser: boolean; time: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollTo(0, ref.current.scrollHeight); }, [messages]);
  return (
    <div ref={ref} className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50">
      {messages.map((msg, i) => (
        <ChatMessage key={i} message={msg.text} isUser={msg.isUser} time={msg.time} />
      ))}
    </div>
  );
} 