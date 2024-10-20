import CopyIcon from '@/app/public/icon/copy.svg';
import EditIcon from '@/app/public/icon/edit.svg';
import DeleteIcon from '@/app/public/icon/delete.svg';
import { ModelDetails } from '@/app/models/hooks/customHooks';

export type ModelCardProps = {
  modelDetails: ModelDetails;
  onEditClick: (modelDetails: ModelDetails) => void;
  onCopyClick: (modelDetails: ModelDetails) => void;
  onDeleteClick: (modelDetails: ModelDetails) => void;
  onConnectClick: (modelDetails: ModelDetails) => void;
};
export default function ModelCard({
  modelDetails,
  onEditClick,
  onCopyClick,
  onDeleteClick,
  onConnectClick,
}: ModelCardProps) {
  return (
    <p className="relative flex flex-col bg-background-600 border border-secondary-200 h-48 w-64 text-sm m-2">
      <div className="absolute top-2 right-2 flex space-x-1">
        <button
          onClick={() => onCopyClick(modelDetails)}
          className="hover:scale-110 transition-transform duration-200 cursor-pointer"
        >
          <CopyIcon className="w-6 h-6" />
        </button>
        <button
          onClick={() => onEditClick(modelDetails)}
          className="hover:scale-110 transition-transform duration-200 cursor-pointer"
        >
          <EditIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="absolute top-2 left-2">
        <button
          onClick={() => onDeleteClick(modelDetails)}
          className="hover:scale-110 transition-transform duration-200 cursor-pointer"
        >
          <DeleteIcon className="w-6 h-6" />
        </button>
      </div>
      <h2 className="text-primary-200 text-center mt-8 mb-2">
        {modelDetails.name}
      </h2>
      <p className="text-primary-400 text-center mb-1">
        {modelDetails.pipeline_tag}
      </p>
      {modelDetails.pipeline_tag === 'text-generation' && (
        <button
          className="text-center mb-1"
          onClick={() => onConnectClick(modelDetails)}
        >
          Connect
        </button>
      )}
    </p>
  );
}
