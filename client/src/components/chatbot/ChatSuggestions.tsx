import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
  "Quels services proposez-vous ?",
  "Comment optimiser mes dépenses ?",
  "Comment fonctionne la simulation ?",
  "Je veux parler à un expert",
  "Aide sur mon dossier",
  "Quels sont les délais de traitement ?"
];

export function ChatSuggestions({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {SUGGESTIONS.map((s, i) => (
        <Button key={i} variant="outline" size="sm" className="rounded-full" onClick={() => onSelect(s)}>
          {s}
        </Button>
      ))}
    </div>
  );
} 