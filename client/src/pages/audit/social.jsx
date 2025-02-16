var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { auditTypes } from "@/utils/audit-utils";
export default function AuditPage() {
    const [location] = useLocation();
    const auditType = location.split("/").pop();
    const audit = auditTypes[auditType];
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [uploadedDocuments, setUploadedDocuments] = useState([]);
    const [confirmationMessage, setConfirmationMessage] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const deleteDocument = useMutation({
        mutationFn: (documentId) => __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`/api/documents/${documentId}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!response.ok)
                throw new Error(yield response.text());
            return response.json();
        }),
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
            setConfirmationMessage(`RDV confirmé le ${format(selectedDate, "dd/MM/yyyy", { locale: fr })} à ${selectedTime}`);
            toast({ title: "RDV confirmé", description: confirmationMessage });
        }
    };
    useEffect(() => {
        const savedDocs = JSON.parse(localStorage.getItem(`${auditType}_documents`) || "{}");
        setUploadedDocuments(savedDocs);
    }, [auditType]);
    return (<div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{audit === null || audit === void 0 ? void 0 : audit.title}</h1>
        <Card>
          <CardHeader>
            <CardTitle>Finalisation du dossier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Button variant="outline" onClick={handleScheduleMeeting}>
                  <Calendar className="h-4 w-4"/> Choisir un créneau
                </Button>
              </div>
              {confirmationMessage && <p className="text-green-600">{confirmationMessage}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);
}
