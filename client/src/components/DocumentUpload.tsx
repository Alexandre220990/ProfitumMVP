import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2 } from "lucide-react";

interface FileUploadProps {
  auditId?: number;
  documentId?: string;
  onUploadComplete?: (files: { id: number; name: string }[]) => void;
}

export default function FileUpload({ auditId, documentId, onUploadComplete }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files) as File[];
      setFiles(selectedFiles);
      await uploadFiles(selectedFiles);
    }
  };

  const uploadFiles = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });
      if (auditId) {
        formData.append("auditId", auditId.toString());
      }
      if (documentId) {
        formData.append("documentId", documentId);
      }

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const uploadedFiles = await response.json();

      toast({
        title: "Succès",
        description: "Les fichiers ont été téléchargés avec succès",
      });

      setFiles([]);
      onUploadComplete?.(uploadedFiles.map((file: any) => ({
        id: file.id,
        name: file.filename || file.name
      })));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Erreur lors du téléchargement des fichiers",
      });
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        id={`file-upload-${documentId || 'default'}`}
        disabled={uploading}
      />
      <label
        htmlFor={`file-upload-${documentId || 'default'}`}
        className="inline-flex justify-center items-center w-8 h-8 text-blue-600 hover:text-blue-700 cursor-pointer transition-colors"
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Upload className="h-5 w-5" />
        )}
      </label>

      {uploading && (
        <Progress value={progress} className="w-full mt-2" />
      )}
    </div>
  );
}