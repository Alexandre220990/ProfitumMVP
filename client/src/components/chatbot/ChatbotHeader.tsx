import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function ChatbotHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-white shadow-sm rounded-t-xl">
      <div className="flex items-center gap-2">
        <img src="/logo192.png" alt="Logo" className="h-8 w-8" />
        <span className="font-bold text-lg text-blue-900">Profitum Chatbot</span>
      </div>
      <Button variant="ghost" onClick={onBack} className="text-gray-500">
        <ArrowLeft className="w-5 h-5 mr-2" /> Retour
      </Button>
    </header>
  );
} 