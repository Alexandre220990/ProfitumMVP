
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { HelpCircle } from "lucide-react"

export type HelpContent = {
  title: string;
  description: string;
  regulations?: {
    title: string;
    content: string;
  }[];
}

interface HelpDialogProps {
  content: HelpContent;
  className?: string;
}

export function HelpDialog({ content, className }: HelpDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={className}
        >
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">Aide</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription className="text-base">
            {content.description}
          </DialogDescription>
        </DialogHeader>
        {content.regulations && (
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold text-lg">Réglementations applicables</h3>
            {content.regulations.map((regulation, index) => (
              <div key={index} className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">{regulation.title}</h4>
                <p className="text-sm text-gray-600">{regulation.content}</p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
