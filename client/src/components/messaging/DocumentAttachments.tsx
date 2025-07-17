import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Share2, X, Paperclip, Image, File, Archive, FileText, Download } from "lucide-react";
import { MessageAttachment } from "@/services/messaging-document-integration";
import { useToast } from "@/hooks/use-toast";

interface DocumentAttachmentsProps {
  attachments: MessageAttachment[];
  onRemoveAttachment?: (attachmentId: string) => void;
  onViewDocument?: (documentId: string) => void;
  onShareDocument?: (documentId: string) => void;
  readonly?: boolean;
}

export const DocumentAttachments: React.FC<DocumentAttachmentsProps> = ({ 
  attachments, 
  onRemoveAttachment, 
  onViewDocument, 
  onShareDocument, 
  readonly = false 
}) => {
  const { toast } = useToast();
  const [expandedAttachment] = useState<string | null>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (attachment: MessageAttachment) => {
    try {
      if (attachment.url) {
        const link = document.createElement('a');
        link.href = attachment.url;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (attachment.documentId) {
        // TODO: Télécharger depuis le système documentaire
        toast({
          title: "Téléchargement",
          description: "Téléchargement en cours..."
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive"
      });
    }
  };

  const handleView = (attachment: MessageAttachment) => {
    if (attachment.documentId && onViewDocument) {
      onViewDocument(attachment.documentId);
    } else if (attachment.url) {
      window.open(attachment.url, '_blank');
    }
  };

  const handleShare = (attachment: MessageAttachment) => {
    if (attachment.documentId && onShareDocument) {
      onShareDocument(attachment.documentId);
    } else {
      toast({
        title: "Partage",
        description: "Fonctionnalité de partage à venir"
      });
    }
  };

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Paperclip className="h-4 w-4" />
        <span>Pièces jointes ({attachments.length})</span>
      </div>

      <div className="grid gap-3">
        {attachments.map((attachment) => (
          <Card key={attachment.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    {getFileIcon(attachment.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium truncate">
                      {attachment.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {formatFileSize(attachment.size)}
                      </Badge>
                      {attachment.documentId && (
                        <Badge variant="outline" className="text-xs">
                          Document lié
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!readonly && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(attachment)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(attachment)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(attachment)}
                        className="h-8 w-8 p-0"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>

                      {onRemoveAttachment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveAttachment(attachment.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            {expandedAttachment === attachment.id && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    <strong>Type: </strong> {attachment.type}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <strong>Uploadé le: </strong> {new Date(attachment.uploadedAt).toLocaleString()}
                  </div>
                  {attachment.documentId && (
                    <div className="text-xs text-muted-foreground">
                      <strong>Document ID: </strong> {attachment.documentId}
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DocumentAttachments; 