import { Bot, User } from "lucide-react";

const BotAvatar = () => (
  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-900 to-green-400 flex items-center justify-center shadow">
    <Bot className="text-white w-6 h-6" />
  </div>
);
const UserAvatar = () => (
  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow">
    <User className="text-white w-6 h-6" />
  </div>
);

export function ChatMessage({ message, isUser, time }: { message: string; isUser: boolean; time: string }) {
  return (
    <div className={`flex items-end gap-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <BotAvatar />}
      <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm text-base whitespace-pre-line ${isUser
        ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-br-md'
        : 'bg-gradient-to-br from-blue-900 to-green-400 text-white rounded-bl-md'}`}
      >
        {message}
        <div className="text-xs text-gray-200 mt-1 text-right">{time}</div>
      </div>
      {isUser && <UserAvatar />}
    </div>
  );
} 