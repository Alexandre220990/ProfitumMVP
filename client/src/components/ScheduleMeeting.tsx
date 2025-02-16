import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";

const getTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    for (let minutes = 0; minutes < 60; minutes += 30) {
      slots.push(`${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }
  }
  return slots;
};

export default function ScheduleMeeting({ onComplete }) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      const formattedDateTime = `RDV confirmé le ${format(selectedDate, 'dd/MM/yyyy', { locale: fr })} à ${selectedTime}`;
      localStorage.setItem("scheduledMeeting", JSON.stringify({ date: selectedDate, time: selectedTime }));
      alert(formattedDateTime);
      setShowDialog(false);
      onComplete();
    }
  };

  return (
    <div>
      <Button onClick={() => setShowDialog(true)}>Choisir un créneau</Button>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sélectionner un créneau</DialogTitle>
            <DialogDescription>Choisissez une date et un horaire pour votre rendez-vous avec l'expert</DialogDescription>
          </DialogHeader>
          <div className="flex gap-6">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={fr}
              disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
              className="rounded-md border"
              showOutsideDays={false}
            />
            {selectedDate && (
              <div>
                <h4 className="text-sm font-medium mb-3">Horaires disponibles</h4>
                <div className="grid grid-cols-2 gap-2">
                  {getTimeSlots().map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleConfirm} disabled={!selectedDate || !selectedTime}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
