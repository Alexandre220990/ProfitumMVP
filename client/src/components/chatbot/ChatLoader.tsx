import { Bot } from "lucide-react";

const BotAvatar = () => (
  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-900 to-green-400 flex items-center justify-center shadow">
    <Bot className="text-white w-6 h-6" />
  </div>
);

export function ChatLoader() {
  return (
    <div className="flex items-center gap-2 my-2">
      <BotAvatar />
      <div className="flex gap-1">
        <span className="block w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="block w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }}></span>
        <span className="block w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></span>
      </div>
      <span className="text-xs text-gray-400 ml-2">Le bot rédige une réponse…</span>
    </div>
  );
} 