'use client';
import React, { useEffect } from 'react';
import { useSubmitDownload } from '@/app/models/download/hooks/customHooks';
import { toast } from 'react-toastify';

export default function DownloadModelPage() {
  const { submitDownloadRequest, response, loading, error } =
    useSubmitDownload();
  const [input, setInput] = React.useState('');
  const handleDownload = (e: React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    void submitDownloadRequest({ hf_model_id: input });
  };
  useEffect(() => {
    if (response) {
      toast(response.message);
    }
  }, [response]);
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);
  return (
    <>
      {loading && <div>Loading...</div>}
      <h1 className="text-3xl font-bold text-center my-4">Download Models</h1>
      <form>
        <input
          type="text"
          placeholder="Search..."
          className="w-1/2 p-2 rounded-md"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="bg-primary-400 text-primary-200 p-2 rounded-md"
          onClick={handleDownload}
        >
          Download
        </button>
      </form>
    </>
  );
}
