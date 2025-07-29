import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { useSirenValidation } from '@/hooks/use-siren-validation';
import { UseFormReturn } from 'react-hook-form';

interface SirenValidationFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const SirenValidationField: React.FC<SirenValidationFieldProps> = ({
  form,
  name,
  label = "Numéro SIREN",
  placeholder = "123456789",
  disabled = false
}) => {
  const { isChecking, validationResult, checkSiren, clearValidation } = useSirenValidation();
  const [debouncedValue, setDebouncedValue] = useState('');

  // Debounce pour éviter trop d'appels API
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentValue = form.getValues(name);
      if (currentValue && currentValue !== debouncedValue) {
        setDebouncedValue(currentValue);
        if (currentValue.replace(/\D/g, '').length === 9) {
          checkSiren(currentValue);
        } else {
          clearValidation();
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.watch(name), checkSiren, clearValidation, name, debouncedValue]);

  const getValidationStatus = () => {
    if (isChecking) return 'checking';
    if (!validationResult) return 'none';
    if (validationResult.exists) return 'error';
    return 'success';
  };

  const getStatusIcon = () => {
    const status = getValidationStatus();
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    const status = getValidationStatus();
    switch (status) {
      case 'checking':
        return 'Vérification en cours...';
      case 'success':
        return 'SIREN disponible';
      case 'error':
        return `SIREN déjà utilisé par ${validationResult?.company_name || 'une autre entreprise'}`;
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    const status = getValidationStatus();
    switch (status) {
      case 'success':
        return 'border-green-500 focus:border-green-500';
      case 'error':
        return 'border-red-500 focus:border-red-500';
      default:
        return '';
    }
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                {...field}
                placeholder={placeholder}
                disabled={disabled}
                className={`pr-10 ${getStatusColor()}`}
                onChange={(e) => {
                  field.onChange(e);
                  // Nettoyer automatiquement le SIREN (garder seulement les chiffres)
                  const cleanValue = e.target.value.replace(/\D/g, '');
                  if (cleanValue.length <= 9) {
                    field.onChange(cleanValue);
                  }
                }}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {getStatusIcon()}
              </div>
            </div>
          </FormControl>
          
          {/* Message de validation */}
          {getValidationStatus() !== 'none' && (
            <Alert className={`mt-2 ${
              getValidationStatus() === 'success' ? 'border-green-200 bg-green-50' :
              getValidationStatus() === 'error' ? 'border-red-200 bg-red-50' :
              'border-blue-200 bg-blue-50'
            }`}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {getStatusMessage()}
              </AlertDescription>
            </Alert>
          )}
          
          <FormMessage />
        </FormItem>
      )}
    />
  );
};