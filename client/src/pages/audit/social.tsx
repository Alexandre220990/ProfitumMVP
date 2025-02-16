import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Check,
  FileSignature,
  Download,
  Trash2,
  Mail,
  Calendar,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import FileUpload from "@/components/FileUpload";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { auditTypes, getTimeSlots } from "@/utils/audit-utils";

export default function AuditPage() {
  const [location] = useLocation();
  const auditType = location.split("/").pop();
  const audit = auditTypes[auditType];
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteDocument = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Succès", description: "Document supprimé avec succès." });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Suppression échouée",
      });
    },
  });

  const handleScheduleMeeting = () => {
    if (selectedDate && selectedTime) {
      setConfirmationMessage(
        `RDV confirmé le ${format(selectedDate, "dd/MM/yyyy", { locale: fr })} à ${selectedTime}`
      );
      toast({ title: "RDV confirmé", description: confirmationMessage });
    }
  };

  useEffect(() => {
    const savedDocs = JSON.parse(localStorage.getItem(`${auditType}_documents`) || "{}");
    setUploadedDocuments(savedDocs);
  }, [auditType]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{audit?.title}</h1>
        <Card>
          <CardHeader>
            <CardTitle>Finalisation du dossier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Button variant="outline" onClick={handleScheduleMeeting}>
                  <Calendar className="h-4 w-4" /> Choisir un créneau
                </Button>
              </div>
              {confirmationMessage && <p className="text-green-600">{confirmationMessage}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
