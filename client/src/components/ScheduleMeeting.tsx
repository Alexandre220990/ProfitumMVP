import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";

interface ScheduleMeetingProps {
  onComplete: () => void;
  className?: string;
}

interface ScheduledMeeting {
  date: Date;
  time: string;
}

const ScheduleMeeting: React.FC<ScheduleMeetingProps> = React.memo(({ 
  onComplete, 
  className = '' 
}) => {
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Génération des créneaux horaires avec useMemo pour éviter les recalculs
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minutes = 0; minutes < 60; minutes += 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  }, []);

  // Gestionnaire de sélection de date optimisé
  const handleDateSelect = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
    // Réinitialiser l'heure si la date change
    if (date !== selectedDate) {
      setSelectedTime(null);
    }
  }, [selectedDate]);

  // Gestionnaire de sélection d'heure optimisé
  const handleTimeSelect = useCallback((time: string) => {
    setSelectedTime(time);
  }, []);

  // Gestionnaire de confirmation optimisé
  const handleConfirm = useCallback(() => {
    if (selectedDate && selectedTime) {
      const formattedDateTime = `RDV confirmé le ${format(selectedDate, 'dd/MM/yyyy', { locale: fr })} à ${selectedTime}`;
      
      // Sauvegarder dans localStorage avec typage
      const meetingData: ScheduledMeeting = { 
        date: selectedDate, 
        time: selectedTime 
      };
      localStorage.setItem("scheduledMeeting", JSON.stringify(meetingData));
      
      alert(formattedDateTime);
      setShowDialog(false);
      onComplete();
    }
  }, [selectedDate, selectedTime, onComplete]);

  // Gestionnaire d'ouverture/fermeture du dialog optimisé
  const handleDialogChange = useCallback((open: boolean) => {
    setShowDialog(open);
    if (!open) {
      // Réinitialiser les sélections si le dialog se ferme
      setSelectedDate(undefined);
      setSelectedTime(null);
    }
  }, []);

  // Gestionnaire d'ouverture du dialog optimisé
  const handleOpenDialog = useCallback(() => {
    setShowDialog(true);
  }, []);

  // Fonction de désactivation des dates optimisée
  const isDateDisabled = useCallback((date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = addDays(today, 30);
    return date < today || date > maxDate;
  }, []);

  // Vérification si la confirmation est possible
  const canConfirm = useMemo(() => {
    return selectedDate && selectedTime;
  }, [selectedDate, selectedTime]);

  return (
    <div className={className}>
      <Button 
        onClick={handleOpenDialog}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        Choisir un créneau
      </Button>
      
      <Dialog open={showDialog} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-800">
              Sélectionner un créneau
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Choisissez une date et un horaire pour votre rendez-vous avec l'expert
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-6 py-4">
            <div className="flex-1">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                locale={fr}
                disabled={isDateDisabled}
                className="rounded-lg border border-slate-200 shadow-sm"
                showOutsideDays={false}
                classNames={{
                  day_selected: "bg-blue-600 text-white hover:bg-blue-700",
                  day_today: "bg-blue-100 text-blue-800 font-semibold",
                  day_disabled: "text-slate-400 cursor-not-allowed"
                }}
              />
            </div>
            
            {selectedDate && (
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-3 text-slate-700">
                  Horaires disponibles
                </h4>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      onClick={() => handleTimeSelect(time)}
                      className={`text-sm ${
                        selectedTime === time 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="border-t pt-4">
            <Button 
              onClick={handleConfirm} 
              disabled={!canConfirm}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              Confirmer le rendez-vous
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

ScheduleMeeting.displayName = 'ScheduleMeeting';

export default ScheduleMeeting;
