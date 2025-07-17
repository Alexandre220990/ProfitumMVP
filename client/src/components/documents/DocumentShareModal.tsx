import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Share2 } from "lucide-react";

interface DocumentShareModalProps { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: (data: {
    email: string;
    view: boolean;
    download: boolean;
    expiresAt?: Date; 
  }) => Promise<void>;
  document?: any;
}

export const DocumentShareModal: React.FC<DocumentShareModalProps> = ({ 
  open, 
  onOpenChange, 
  onShare, 
  document 
}) => { 
  const [email, setEmail] = useState('');
  const [view, setView] = useState(true);
  const [download, setDownload] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!email) return;
    
    setSharing(true);
    try {
      await onShare({
        email, 
        view, 
        download 
      });
      onOpenChange(false);
      setEmail('');
      setView(true);
      setDownload(false);
    } catch (error) { 
      console.error('Erreur partage: ', error); 
    } finally { 
      setSharing(false); 
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Partager le document</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {document && (
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm font-medium">{document.original_filename}</p>
              <p className="text-xs text-gray-600">{document.category}</p>
            </div>
          )}

          <div>
            <Label htmlFor="email">Email du destinataire</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="view">Autoriser la visualisation</Label>
                <p className="text-xs text-gray-600">Le destinataire peut voir le document</p>
              </div>
              <Switch
                id="view"
                checked={view}
                onCheckedChange={setView}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="download">Autoriser le téléchargement</Label>
                <p className="text-xs text-gray-600">Le destinataire peut télécharger le document</p>
              </div>
              <Switch
                id="download"
                checked={download}
                onCheckedChange={setDownload}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleShare} disabled={!email || sharing}>
              <Share2 className="w-4 h-4 mr-2" />
              {sharing ? 'Partage...' : 'Partager'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 