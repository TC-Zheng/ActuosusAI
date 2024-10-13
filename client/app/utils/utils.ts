import { toast } from 'react-toastify';

export const error_toast = (message: string) => {
  toast.error(message, { position: 'bottom-center', theme: 'colored' });
};

export const success_toast = (message: string) => {
  toast.success(message, { position: 'bottom-center', theme: 'colored' });
}