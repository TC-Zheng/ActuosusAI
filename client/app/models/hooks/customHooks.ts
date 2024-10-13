import { ModelDetails } from '@/app/models/page';
import { useApiRequest } from '@/app/hooks/useApiRequest';
import { useEffect } from 'react';

export type GetModelsResponse = {
  success: boolean;
  models: ModelDetails[];
};

export const useFetchModels = () => {
  const { executeFetch, response, loading, error } =
    useApiRequest<GetModelsResponse>();
  const fetchModels = async () => {
    void executeFetch('http://127.0.0.1:8000/models/');
  };
  useEffect(() => {
    void fetchModels();
  }, [executeFetch]);
  const models_details = response?.models ?? [];

  return {
    models_details,
    fetchModels,
    fetchModelLoading: loading,
    fetchModelError: error,
  };
};
export type CopyModelResponse = {
  success: boolean;
  message: string;
};

export const usePostCopyModel = () => {
  const { executeFetch, response, loading, error } =
    useApiRequest<CopyModelResponse>();
  const postCopyRequest = async (ai_model_id: number) => {
    void executeFetch(`http://127.0.0.1:8000/model/${ai_model_id}/copy`, {
      method: 'POST',
    });
  };
  return {
    postCopyRequest,
    copyModelResponse: response,
    copyModelLoading: loading,
    copyModelError: error,
  };
};

export const useDeleteModel = () => {
  const { executeFetch, response, loading, error } =
    useApiRequest<CopyModelResponse>();
  const deleteModelRequest = async (ai_model_id: number) => {
    void executeFetch(`http://127.0.0.1:8000/model/${ai_model_id}`, {
      method: 'DELETE',
    });
  };
  return {
    deleteModelRequest,
    deleteModelResponse: response,
    deleteModelLoading: loading,
    deleteModelError: error,
  };
};

export const useSubmitEditName = () => {
  const { executeFetch, response, loading, error } =
    useApiRequest<GetModelsResponse>();
  const submitEditNameRequest = async (ai_model_id: number, name: string) => {
    void executeFetch(`http://127.0.0.1:8000/model/${ai_model_id}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ai_model_id, name }),
    });
  };
  return { submitEditNameRequest, response, loading, error };
};
