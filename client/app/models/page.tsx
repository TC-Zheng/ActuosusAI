'use client';
import ModelCard from '@/app/models/components/ModelCard';
import Loader from '@/app/components/Loader';
import {
  useDeleteModel,
  useFetchModels,
  usePostCopyModel,
} from '@/app/models/hooks/customHooks';
import React, { useEffect, useState } from 'react';
import { error_toast, success_toast } from '@/app/utils/utils';
import Link from 'next/link';
import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';

export type ModelDetails = {
  ai_model_id: number;
  name: string;
  pipeline_tag: string;
  created_at: string;
  updated_at: string;
};

export default function ModelsPage() {
  const [selectedModel, setSelectedModel] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const { models_details, fetchModels, fetchModelLoading, fetchModelError } =
    useFetchModels();
  const {
    postCopyRequest,
    copyModelResponse,
    copyModelLoading,
    copyModelError,
  } = usePostCopyModel();
  const {
    deleteModelRequest,
    deleteModelResponse,
    deleteModelLoading,
    deleteModelError,
  } = useDeleteModel();

  const loading = fetchModelLoading || copyModelLoading || deleteModelLoading;
  const error = fetchModelError || copyModelError || deleteModelError;
  useEffect(() => {
    if (error) {
      error_toast(error);
    }
  }, [error]);

  useEffect(() => {
    if (copyModelResponse) {
      success_toast(copyModelResponse.message);
      void fetchModels();
    } else if (deleteModelResponse) {
      success_toast(deleteModelResponse.message);
      void fetchModels();
    }
  }, [copyModelResponse, deleteModelResponse]);

  const handleCopy = (ai_model_id: number) => {
    void postCopyRequest(ai_model_id);
  };
  const handleEdit = (ai_model_id: number) => {
    console.log(`Edit ${ai_model_id}`);
  };
  const handleDelete = (ai_model_id: number) => {
    setOpen(true);
    setSelectedModel(ai_model_id);
    // void deleteModelRequest(ai_model_id);
  };
  return (
    <>
      {loading && <Loader />}
      {!loading && (
        <>
          <div>Title</div>
          <Link href="/models/download">Download</Link>
          <div className="flex flex-wrap justify-center">
            {models_details.map(
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
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            className="relative z-50"
          >
            <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
              <DialogPanel className="max-w-lg space-y-4 border bg-background-700 p-12 text-accent-50">
                <DialogTitle className="font-bold">Delete Model</DialogTitle>
                <Description>
                  This will permanently delete this model
                </Description>
                <p>
                  Are you sure you want to delete the model? This action cannot
                  be undone.
                </p>
                <div className="flex gap-4">
                  <button onClick={() => setOpen(false)}>Cancel</button>
                  <button
                    onClick={() => {
                      setOpen(false);
                      void deleteModelRequest(selectedModel);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </DialogPanel>
            </div>
          </Dialog>
        </>
      )}
    </>
  );
}
