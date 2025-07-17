import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { XCircle, CheckCircle } from "lucide-react";

interface DocumentValidationModalProps { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValidate: (data: {
    status: 'approved' | 'rejected';
    comment: string; 
  }) => Promise<void>;
  document?: any;
}

export const DocumentValidationModal: React.FC<DocumentValidationModalProps> = ({ 
  open, 
  onOpenChange, 
  onValidate, 
  document 
}) => { 
  const [status, setStatus] = useState<'approved' | 'rejected'>('approved');
  const [comment, setComment] = useState('');
  const [validating, setValidating] = useState(false);

  const handleValidate = async () => {
    setValidating(true);
    try {
      await onValidate({
        status, 
        comment 
      });
      onOpenChange(false);
      setStatus('approved');
      setComment('');
    } catch (error) { 
      console.error('Erreur validation: ', error); 
    } finally { 
      setValidating(false); 
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Valider le document</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {document && (
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm font-medium">{document.original_filename}</p>
              <p className="text-xs text-gray-600">{document.category}</p>
            </div>
          )}

          <div>
            <Label htmlFor="status">Statut</Label>
            <Select value={status} onValueChange={(value: 'approved' | 'rejected') => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Approuvé
                  </div>
                </SelectItem>
                <SelectItem value="rejected">
                  <div className="flex items-center">
                    <XCircle className="w-4 h-4 mr-2 text-red-600" />
                    Rejeté
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="comment">Commentaire</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Commentaire de validation..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleValidate} 
              disabled={validating}
              variant={status === 'approved' ? 'default' : 'destructive'}
            >
              {status === 'approved' ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              {validating ? 'Validation...' : 'Valider'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 