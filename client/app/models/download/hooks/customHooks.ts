import { useApiRequest } from '@/app/hooks/useApiRequest';

export type DownloadModelResponse = {
  success: boolean;
  message: string;
};
export type DownloadModelPayload = {
  hf_model_id: string;
};

export const useSubmitDownload = () => {
  const { executeFetch, response, loading, error } =
    useApiRequest<DownloadModelResponse>();
  const submitDownloadRequest = async (payload: DownloadModelPayload) => {
    void executeFetch('http://127.0.0.1:8000/download/hf_lang_model/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  };
  return { submitDownloadRequest, response, loading, error };
};
