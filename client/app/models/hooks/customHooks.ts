import { ModelDetails } from '@/app/models/page';
import { useApiRequest } from '@/app/hooks/useApiRequest';
import { useEffect } from 'react';

export type GetModelsResponse = {
  success: boolean;
  models_details: ModelDetails[];
};

export const useFetchModels = () => {
  const { executeFetch, response, loading, error } =
    useApiRequest<GetModelsResponse>();
  useEffect(() => {
    void executeFetch('http://127.0.0.1:8000/models/');
  }, [executeFetch]);
  const models_details = response?.models_details ?? [];

  return { models_details, loading, error };
};

export const useSubmitCopy = () => {
  const { executeFetch, response, loading, error } =
    useApiRequest<GetModelsResponse>();
  const submitCopyRequest = async (ai_model_id: number) => {
    void executeFetch('http://127.0.0.1:8000/copy/model/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ai_model_id }),
    });
  };
  return { submitCopyRequest, response, loading, error };
};

export const useSubmitEditName = () => {
  const { executeFetch, response, loading, error } =
    useApiRequest<GetModelsResponse>();
  const submitEditNameRequest = async (ai_model_id: number, name: string) => {
    void executeFetch('http://127.0.0.1:8000/edit/model_name/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ai_model_id, name }),
    });
  };
  return { submitEditNameRequest, response, loading, error };
};
