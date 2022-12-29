import { useState } from 'react';
import { Alert, Button, Toast } from 'react-daisyui';

let gSetToasts;
let successTimeoutId;

type ToastItem = {
  text: string;
  status: 'success' | 'error';
};

export const Toaster = () => {
  const [toasts, setToasts] = useState({} as { success?: ToastItem; error?: ToastItem });

  gSetToasts = setToasts;

  return (
    <div className='App'>
      <Toast horizontal='end' vertical='bottom'>
        {[toasts.success, toasts.error].map((toast: ToastItem | undefined, index) => {
          if (!toast) return null;

          return (
            <Alert key={`toast-${index}`} status={toast.status} className='rounded py-3'>
              <h3>{toast.text}</h3>
              <Button
                color='ghost'
                onClick={() =>
                  setToasts({
                    success: toast.status === 'success' ? undefined : toasts.success,
                    error: toast.status === 'error' ? undefined : toasts.error,
                  })
                }>
                X
              </Button>
            </Alert>
          );
        })}
      </Toast>
    </div>
  );
};

export const successToast = (text: string) => {
  if (gSetToasts) {
    gSetToasts({ success: { text, status: 'success' } });
    clearTimeout(successTimeoutId);
    successTimeoutId = setTimeout(() => {
      clearTimeout(successTimeoutId);
      gSetToasts((prevToasts) => ({ success: undefined, error: prevToasts.error }));
    }, 10000);
  }
};

export const errorToast = (text: string) => {
  if (gSetToasts) {
    gSetToasts((prevToasts) => ({ success: prevToasts.success, error: { text, status: 'error' } }));
  }
};
