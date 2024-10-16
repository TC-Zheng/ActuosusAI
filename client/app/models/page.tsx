'use client';
import ModelCard from '@/app/models/components/ModelCard';
import Loader from '@/app/components/Loader';
import {
  useDeleteModel,
  useGetModelDetails,
  useGetSearchHub,
  usePostCopyModel,
  usePostDownload,
} from '@/app/models/hooks/customHooks';
import React, { useEffect, useState } from 'react';
import { success_toast, useDebounce, warning_toast } from '@/app/utils/utils';
import DeleteDialog from '@/app/models/components/DeleteDialog';
import SearchDownloadComboBox from '@/app/models/components/SearchDownloadComboBox';

export default function ModelsPage() {
  const [selectedModel, setSelectedModel] = useState<number>(0);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [selectedSearchName, setSelectedSearchName] = useState<string>('');

  const { getModelDetails, modelDetailsResponse, modelDetailsLoading } =
    useGetModelDetails();

  const { postCopyModel, copyModelResponse, copyModelLoading } =
    usePostCopyModel();

  const { deleteModel, deleteModelResponse, deleteModelLoading } =
    useDeleteModel();

  const { postDownloadModel, downloadModelResponse, downloadModelLoading } =
    usePostDownload();
  const { getSearchHub, searchResponse } = useGetSearchHub();
  const debouncedSearchHub = useDebounce(getSearchHub, 300);

  // Fetch model details on page load
  useEffect(() => {
    void getModelDetails();
  }, [getModelDetails]);

  // After copy, delete, edit, or download, refresh the model details
  useEffect(() => {
    if (deleteModelResponse) {
      success_toast(deleteModelResponse.message);
      void getModelDetails();
    }
  }, [deleteModelResponse, getModelDetails]);
  useEffect(() => {
    if (copyModelResponse) {
      success_toast(copyModelResponse.message);
      void getModelDetails();
    }
  }, [copyModelResponse, getModelDetails]);
  useEffect(() => {
    if (downloadModelResponse) {
      success_toast(downloadModelResponse.message);
      void getModelDetails();
    }
  }, [downloadModelResponse, getModelDetails]);

  const handleCopy = (ai_model_id: number) => {
    if (copyModelLoading) {
      warning_toast(
        'Currently processing another copy request, please wait for it to finish'
      );
    } else {
      void postCopyModel(ai_model_id);
    }
  };
  const handleEdit = (ai_model_id: number) => {
    console.log(`Edit ${ai_model_id}`);
  };
  const handleDelete = (ai_model_id: number) => {
    if (deleteModelLoading) {
      warning_toast(
        'Currently processing another delete request, please wait for it to finish'
      );
    } else {
      setOpenDeleteDialog(true);
      setSelectedModel(ai_model_id);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const trimmedInput = e.target.value.trim();
    if (trimmedInput) {
      debouncedSearchHub(trimmedInput);
    }
  };
  return (
    <>
      <h1 className="text-2xl text-center mt-10">Download Model</h1>
      <SearchDownloadComboBox
        selectedSearchName={selectedSearchName}
        setSelectedSearchName={setSelectedSearchName}
        model_names={searchResponse?.model_names ?? []}
        onInputChange={handleInputChange}
        onDownloadModelClick={() => {
          void postDownloadModel({ hf_model_id: selectedSearchName });
        }}
        downloadModelLoading={downloadModelLoading}
      />
      {modelDetailsLoading && <Loader />}
      {!modelDetailsLoading && (
        <>
          <h1 className="text-2xl text-center mt-10">Model List</h1>
          <div className="flex flex-wrap justify-center">
            {(modelDetailsResponse?.models ?? []).map(
              ({ name, pipeline_tag, ai_model_id, created_at, updated_at }) => (
                <ModelCard
                  key={ai_model_id}
                  name={name}
                  pipeline_tag={pipeline_tag}
                  ai_model_id={ai_model_id}
                  created_at={created_at}
                  updated_at={updated_at}
                  handleCopy={handleCopy}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              )
            )}
          </div>
          <DeleteDialog
            open={openDeleteDialog}
            onClose={() => setOpenDeleteDialog(false)}
            onClick={() => {
              setOpenDeleteDialog(false);
              void deleteModel(selectedModel);
            }}
          />
        </>
      )}
    </>
  );
}
