export interface ToastOptions {
  description?: string;
}

export const toast = (message: string, options?: ToastOptions) => {
  console.log(`[Toast] ${message}`, options?.description || '');
};

toast.success = (message: string, options?: ToastOptions) => {
  console.log(`[Toast Success] ${message}`, options?.description || '');
};

toast.error = (message: string, options?: ToastOptions) => {
  console.error(`[Toast Error] ${message}`, options?.description || '');
};

toast.info = (message: string, options?: ToastOptions) => {
  console.info(`[Toast Info] ${message}`, options?.description || '');
};
