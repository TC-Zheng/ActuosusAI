import { useCallback } from 'react';
import useFetch from '@/app/hooks/useFetch';
import { baseURL } from '@/app/utils/constants';

export type ModelDetails = {
  ai_model_id: number;
  name: string;
  pipeline_tag: string;
  created_at: string;
  updated_at: string;
};

export type GetModelDetailsResponse = {
  success: boolean;
  models: ModelDetails[];
};

export const useGetModelDetails = () => {
  const { fetchData, response, loading, error } =
    useFetch<GetModelDetailsResponse>();
  const getModelDetails = useCallback(async () => {
    void fetchData(`${baseURL}/models/`);
  }, [fetchData]);

  return {
    getModelDetails,
    modelDetailsResponse: response,
    modelDetailsLoading: loading,
    modelDetailsError: error,
  };
};

export type CopyModelResponse = {
  success: boolean;
  message: string;
};

export const usePostCopyModel = () => {
  const { fetchData, response, loading, error } = useFetch<CopyModelResponse>();
  const postCopyModel = useCallback(
    async (ai_model_id: number) => {
      void fetchData(`${baseURL}/model/${ai_model_id}/copy`, {
        method: 'POST',
      });
    },
    [fetchData]
  );
  return {
    postCopyModel,
    copyModelResponse: response,
    copyModelLoading: loading,
    copyModelError: error,
  };
};
export type DeleteModelResponse = {
  success: boolean;
  message: string;
};
export const useDeleteModel = () => {
  const { fetchData, response, loading, error } =
    useFetch<DeleteModelResponse>();
  const deleteModel = useCallback(
    async (ai_model_id: number) => {
      void fetchData(`${baseURL}/model/${ai_model_id}/`, {
        method: 'DELETE',
      });
    },
    [fetchData]
  );
  return {
    deleteModel,
    deleteModelResponse: response,
    deleteModelLoading: loading,
    deleteModelError: error,
  };
};

export type EditModelResponse = {
  success: boolean;
  message: string;
};

export const useSubmitEditName = () => {
  const { fetchData, response, loading, error } = useFetch<EditModelResponse>();
  const postEditModel = async (
    ai_model_id: number,
    attr: Record<string, string>
  ) => {
    void fetchData(`${baseURL}/model/${ai_model_id}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attr),
    });
  };
  return {
    postEditModel,
    editModelResponse: response,
    editModelLoading: loading,
    editModelError: error,
  };
};

export type DownloadModelResponse = {
  success: boolean;
  message: string;
};
export type DownloadModelPayload = {
  hf_model_id: string;
};

export const usePostDownload = () => {
  const { fetchData, response, loading, error } =
    useFetch<DownloadModelResponse>();
  const postDownloadModel = async (payload: DownloadModelPayload) => {
    void fetchData(`${baseURL}/download/hf_lang_model/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  };
  return {
    postDownloadModel,
    downloadModelResponse: response,
    downloadModelLoading: loading,
    downloadModelError: error,
  };
};

export type SearchModelResponse = {
  ai_model_names: Array<string>;
};
export const useGetSearchHub = () => {
  const { fetchData, response, loading, error } =
    useFetch<SearchModelResponse>();
  const getSearchHub = async (ai_model_name: string) => {
    void fetchData(`${baseURL}/huggingface/search/${ai_model_name}/`);
  };
  return {
    getSearchHub,
    searchResponse: response,
    searchLoading: loading,
    searchError: error,
  };
};

export type GGUFFileNamesResponse = {
  gguf_file_names: Array<string>;
};

export const useGetGGUFFileNames = () => {
  const { fetchData, response, loading, error } =
    useFetch<GGUFFileNamesResponse>();
  const getGGUFFileNames = async (ai_model_id: number) => {
    void fetchData(`${baseURL}/gguf/files/${ai_model_id}/`);
  };
  return {
    getGGUFFileNames,
    ggufFileNamesResponse: response,
    ggufFileNamesLoading: loading,
    ggufFileNamesError: error,
  };
};
