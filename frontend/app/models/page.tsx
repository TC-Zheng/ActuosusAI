'use client';
import ModelCard from '@/app/models/components/ModelCard';
import Loader from '@/app/components/Loader';
import {
  ModelDetails,
  useDeleteModel,
  useGetGGUFFileNames,
  useGetModelDetails,
  useGetSearchHub,
  usePostCopyModel,
  usePostDownload,
} from '@/app/models/hooks/customHooks';
import React, { useEffect, useState } from 'react';
import { success_toast, useDebounce, warning_toast } from '@/app/utils/utils';
import DeleteDialog from '@/app/models/components/DeleteDialog';
import SearchDownloadComboBox from '@/app/models/components/SearchDownloadComboBox';
import ConnectDialog from '@/app/models/components/ConnectDialog';

export default function ModelsPage() {
  const [selectedModel, setSelectedModel] = useState<ModelDetails | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [openConnectDialog, setOpenConnectDialog] = useState<boolean>(false);
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

  const { getGGUFFileNames, ggufFileNamesResponse } = useGetGGUFFileNames();

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

  useEffect(() => {
    if (ggufFileNamesResponse) {
      setOpenConnectDialog(true);
    }
  }, [ggufFileNamesResponse]);

  const handleCopy = (modelDetails: ModelDetails) => {
    if (copyModelLoading) {
      warning_toast(
        'Currently processing another copy request, please wait for it to finish'
      );
    } else {
      void postCopyModel(modelDetails.ai_model_id);
    }
  };
  const handleEdit = (modelDetails: ModelDetails) => {
    console.log(`Edit ${modelDetails.ai_model_id}`);
  };
  const handleDelete = (modelDetails: ModelDetails) => {
    if (deleteModelLoading) {
      warning_toast(
        'Currently processing another delete request, please wait for it to finish'
      );
    } else {
      setOpenDeleteDialog(true);
      setSelectedModel(modelDetails);
    }
  };
  const handleConnect = (modelDetails: ModelDetails) => {
    void getGGUFFileNames(modelDetails.ai_model_id);
    setSelectedModel(modelDetails);
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
      {modelDetailsLoading && <Loader />}
      {!modelDetailsLoading && (
        <>
          <h1 className="text-2xl text-center mt-10">Model List</h1>
          <div className="flex flex-wrap justify-center m-10">
            {(modelDetailsResponse?.models ?? []).map((modelDetails) => (
              <ModelCard
                key={modelDetails.ai_model_id}
                modelDetails={modelDetails}
                onCopyClick={handleCopy}
                onEditClick={handleEdit}
                onDeleteClick={handleDelete}
                onConnectClick={handleConnect}
              />
            ))}
          </div>
          <DeleteDialog
            open={openDeleteDialog}
            onClose={() => setOpenDeleteDialog(false)}
            onClick={() => {
              setOpenDeleteDialog(false);
              void deleteModel(selectedModel!.ai_model_id);
            }}
          />
          <ConnectDialog
            open={openConnectDialog}
            onClose={() => setOpenConnectDialog(false)}
            selectedModel={selectedModel!}
            ggufFileNames={ggufFileNamesResponse?.gguf_file_names ?? []}
          />
        </>
      )}
    </>
  );
}
