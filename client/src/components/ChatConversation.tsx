import React from 'react';
import { Message } from '../types/chatbot';

interface ChatConversationProps {
  messages: Message[];
}

export const ChatConversation: React.FC<ChatConversationProps> = ({ messages }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-3 ${
              message.isUser
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            <div className="text-sm">{message.text}</div>
            <div className="text-xs mt-1 opacity-70">{message.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}; 