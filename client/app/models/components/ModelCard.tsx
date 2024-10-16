'use client';
import CopyIcon from '@/app/public/icon/copy.svg';
import EditIcon from '@/app/public/icon/edit.svg';
import DeleteIcon from '@/app/public/icon/delete.svg';

export type ModelCardProps = {
  name: string;
  pipeline_tag: string;
  created_at: string;
  updated_at: string;
  ai_model_id: number;
  handleEdit: (ai_model_id: number) => void;
  handleCopy: (ai_model_id: number) => void;
  handleDelete: (ai_model_id: number) => void;
};
export default function ModelCard({
  name,
  pipeline_tag,
  ai_model_id,
  created_at,
  updated_at,
  handleEdit,
  handleCopy,
  handleDelete,
}: ModelCardProps) {
  return (
    <div
      className="relative flex flex-col bg-background-600 border border-secondary-200 h-32 w-64 text-sm m-2"
      onClick={() => console.log(ai_model_id)}
    >
      <div className="absolute top-2 right-2 flex space-x-1">
        <button
          onClick={() => handleCopy(ai_model_id)}
          className="hover:scale-110 transition-transform duration-200 cursor-pointer"
        >
          <CopyIcon className="w-6 h-6" />
        </button>
        <button
          onClick={() => handleEdit(ai_model_id)}
          className="hover:scale-110 transition-transform duration-200 cursor-pointer"
        >
          <EditIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="absolute top-2 left-2">
        <button
          onClick={() => handleDelete(ai_model_id)}
          className="hover:scale-110 transition-transform duration-200 cursor-pointer"
        >
          <DeleteIcon className="w-6 h-6" />
        </button>
      </div>
      <h2 className="text-primary-200 text-center mt-8 mb-2">{name}</h2>
      <p className="text-primary-400 text-center mb-1">{pipeline_tag}</p>
    </div>
  );
}
