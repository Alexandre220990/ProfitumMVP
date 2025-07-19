import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/design-system/Card';
import Button from '@/components/ui/design-system/Button';
import { Badge } from '@/components/ui/design-system/Badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, FileText, Send, Phone, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast-notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useExpertDossierActions } from '@/hooks/use-expert-dossier-actions';

interface DossierActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossierId: string;
  stepId: number;
  action: string;
}

const DossierActionModal: React.FC<DossierActionModalProps> = ({
  isOpen,
  onClose,
  dossierId,
  stepId,
  action,
}) => {
  const { handleStepAction, handleDocumentAction } = useExpertDossierActions();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let success = false;

      switch (action) {
        case 'sign_charte':
          success = await handleStepAction(dossierId, stepId, action, {
            signature: formData.signature,
            terms: formData.terms
          });
          break;

        case 'upload':
          if (formData.file) {
            success = await handleDocumentAction(dossierId, formData.documentName, action, formData.file, formData.metadata);
          }
          break;

        case 'contact_client':
          success = await handleStepAction(dossierId, stepId, action, {
            message: formData.message,
            type: formData.contactType
          });
          break;

        case 'schedule_meeting':
          success = await handleStepAction(dossierId, stepId, action, {
            startDate: formData.startDate,
            endDate: formData.endDate,
            description: formData.description,
            type: formData.meetingType
          });
          break;

        default:
          success = await handleStepAction(dossierId, stepId, action, formData);
      }

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderActionForm = () => {
    switch (action) {
      case 'sign_charte':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Conditions d'engagement
              </label>
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg max-h-40 overflow-y-auto">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  En signant cette charte, vous vous engagez à respecter les conditions d'engagement 
                  définies pour ce dossier. Cette signature confirme votre accord avec les termes 
                  et conditions du service.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={formData.terms || false}
                onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
                className="rounded border-neutral-300"
              />
              <label htmlFor="terms" className="text-sm text-neutral-700 dark:text-neutral-300">
                J'accepte les conditions d'engagement
              </label>
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Document à uploader
              </label>
              <input
                type="file"
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] })}
                className="w-full p-2 border border-neutral-300 rounded-lg"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Nom du document
              </label>
              <input
                type="text"
                value={formData.documentName || ''}
                onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
                className="w-full p-2 border border-neutral-300 rounded-lg"
                placeholder="Nom du document"
              />
            </div>
          </div>
        );

      case 'contact_client':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Type de contact
              </label>
              <select
                value={formData.contactType || ''}
                onChange={(e) => setFormData({ ...formData, contactType: e.target.value })}
                className="w-full p-2 border border-neutral-300 rounded-lg"
              >
                <option value="">Sélectionner un type</option>
                <option value="email">Email</option>
                <option value="phone">Téléphone</option>
                <option value="meeting">Rendez-vous</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Message
              </label>
              <textarea
                value={formData.message || ''}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full p-2 border border-neutral-300 rounded-lg h-32"
                placeholder="Votre message..."
              />
            </div>
          </div>
        );

      case 'schedule_meeting':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Type de rendez-vous
              </label>
              <select
                value={formData.meetingType || ''}
                onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}
                className="w-full p-2 border border-neutral-300 rounded-lg"
              >
                <option value="">Sélectionner un type</option>
                <option value="consultation">Consultation</option>
                <option value="validation">Validation</option>
                <option value="presentation">Présentation</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Date de début
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full p-2 border border-neutral-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Date de fin
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full p-2 border border-neutral-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border border-neutral-300 rounded-lg h-20"
                placeholder="Description du rendez-vous..."
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-neutral-600 dark:text-neutral-400">
              Action non configurée : {action}
            </p>
          </div>
        );
    }
  };

  const getActionIcon = () => {
    switch (action) {
      case 'sign_charte':
        return <CheckCircle className="w-6 h-6" />;
      case 'upload':
        return <Upload className="w-6 h-6" />;
      case 'contact_client':
        return <MessageSquare className="w-6 h-6" />;
      case 'schedule_meeting':
        return <Calendar className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const getActionTitle = () => {
    switch (action) {
      case 'sign_charte':
        return 'Signature de la charte';
      case 'upload':
        return 'Upload de document';
      case 'contact_client':
        return 'Contact client';
      case 'schedule_meeting':
        return 'Planifier un rendez-vous';
      default:
        return 'Action';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <Card className="relative">
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center space-x-3">
                  {getActionIcon()}
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                    {getActionTitle()}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-1"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {renderActionForm()}

                <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>En cours...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Confirmer</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DossierActionModal; 