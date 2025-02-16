import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import axios from "axios";

function ExpertSelection({ open, onClose, auditType }) {
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [experts, setExperts] = useState([]);

  useEffect(() => {
    if (open) {
      axios
        .get("/api/experts", { params: { auditType } })
        .then((response) => {
          setExperts(response.data);
        })
        .catch((error) => {
          console.error("Erreur lors de la récupération des experts:", error);
        });
    }
  }, [open, auditType]);

  const handleSelect = (expert) => {
    setSelectedExpert(expert);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sélectionnez un expert</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {experts.length > 0 ? (
            experts.map((expert) => (
              <div
                key={expert.id}
                className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-100 ${selectedExpert?.id === expert.id ? "border-blue-500 bg-blue-50" : ""}`}
                onClick={() => handleSelect(expert)}
              >
                <h3 className="font-semibold">{expert.name}</h3>
                <p className="text-sm text-gray-600">Spécialité: {expert.specialty}</p>
                <p className="text-sm text-gray-600">Expérience: {expert.experience} ans</p>
                <p className="text-sm text-gray-600">Note: {expert.rating} ⭐</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Aucun expert disponible pour cet audit.</p>
          )}
        </div>
        <DialogFooter className="flex justify-end">
          <Button onClick={() => onClose(selectedExpert)} disabled={!selectedExpert}>
            Valider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ExpertSelection;
