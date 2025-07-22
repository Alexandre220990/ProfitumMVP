import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";

interface DocumentUploadModalProps { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (data: {
    file: File;
    category: string;
    description: string;
    requestId?: string; 
  }) => Promise<void>;
  category?: string;
  requestId?: string;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ 
  open, 
  onOpenChange, 
  onUpload, 
  category = 'autre', 
  requestId 
}) => { 
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    try {
      await onUpload({
        file, 
        category, 
        description, 
        requestId 
      });
      onOpenChange(false);
      setFile(null);
      setDescription('');
    } catch (error) { 
      console.error('Erreur upload: ', error); 
    } finally { 
      setUploading(false); 
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload de document</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="file">Fichier</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du document..."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpload} disabled={!file || uploading}>
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Upload...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 