'use client';
import ModelCard from '@/app/models/components/ModelCard';
import Loader from '@/app/components/Loader';
import { useFetchModels } from '@/app/models/hooks/customHooks';
import React, { useEffect } from 'react';
import { error_toast } from '@/app/utils/utils';
import Link from 'next/link';

export type ModelDetails = {
  ai_model_id: number;
  name: string;
  pipeline_tag: string;
  created_at: string;
  updated_at: string;
};

export default function ModelsPage() {
  const { models_details, loading, error } = useFetchModels();

  useEffect(() => {
    if (error) {
      error_toast(error);
    }
  }, [error]);

  const handleCopy = (ai_model_id: number) => {
    console.log(`Copy ${ai_model_id}`);
  };
  const handleEdit = (ai_model_id: number) => {
    console.log(`Edit ${ai_model_id}`);
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
                />
              )
            )}
          </div>
        </>
      )}
    </>
  );
}
