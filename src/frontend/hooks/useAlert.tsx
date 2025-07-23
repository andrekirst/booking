import { useState } from 'react';
import { Alert, AlertType } from '@/app/components/ui/Alert';

interface AlertState {
  type: AlertType;
  title?: string;
  message: string;
  duration?: number;
}

export function useAlert() {
  const [alert, setAlert] = useState<AlertState | null>(null);

  const showAlert = (type: AlertType, message: string, title?: string, duration?: number) => {
    setAlert({ type, message, title, duration });
  };

  const showSuccess = (message: string, title?: string, duration?: number) => {
    showAlert('success', message, title, duration);
  };

  const showError = (message: string, title?: string, duration?: number) => {
    showAlert('error', message, title, duration);
  };

  const showInfo = (message: string, title?: string, duration?: number) => {
    showAlert('info', message, title, duration);
  };

  const showWarning = (message: string, title?: string, duration?: number) => {
    showAlert('warning', message, title, duration);
  };

  const hideAlert = () => {
    setAlert(null);
  };

  const AlertComponent = alert ? (
    <Alert
      type={alert.type}
      title={alert.title}
      message={alert.message}
      duration={alert.duration}
      onClose={hideAlert}
    />
  ) : null;

  return {
    showAlert,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    hideAlert,
    AlertComponent,
  };
}