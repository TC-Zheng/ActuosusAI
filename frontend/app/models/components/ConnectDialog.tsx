import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import Link from 'next/link';
import { ModelDetails } from '@/app/models/hooks/customHooks';
import { ChatType } from '@/app/models/chat/constants';

type ConnectDialogProps = {
  open: boolean;
  onClose: () => void;
  selectedModel: ModelDetails;
  ggufFileNames: string[];
};

export default function ConnectDialog({
  open,
  onClose,
  selectedModel,
  ggufFileNames,
}: ConnectDialogProps) {
  const [selectedQuantization, setSelectedQuantization] = useState('float32');
  const [selectedGGUFFileName, setSelectedGGUFFileName] = useState<string>(
    ggufFileNames.length > 1 ? ggufFileNames[0] : ''
  );

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedQuantization(e.target.value);
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="max-w-lg space-y-4 border bg-background-400 p-12 items-center flex flex-col">
          <DialogTitle className="font-bold text-center">
            Connecting to {selectedModel?.name}
          </DialogTitle>
          <div className="flex gap-4 text-center">
            <div className="flex flex-col items-center">
              {ggufFileNames?.length > 0 ? (
                <>
                  <label>Choose a gguf file to load the model</label>
                  <select
                    value={selectedGGUFFileName}
                    onChange={(e) => setSelectedGGUFFileName(e.target.value)}
                    className="text-secondary-900"
                  >
                    {ggufFileNames.map((ggufFileName) => (
                      <option key={ggufFileName} value={ggufFileName}>
                        {ggufFileName}
                      </option>
                    ))}
                  </select>
                  {/*<p>You selected {selectedGGUFFileName}</p>*/}
                </>
              ) : (
                <>
                  <label>
                    Choose the datatype you want to load the model in. Smaller
                    datatype may degrade the model&#39;s performance:
                  </label>
                  <select
                    value={selectedQuantization}
                    onChange={handleChange}
                    className="text-secondary-900"
                  >
                    <option value="float32">float32</option>
                    <option value="float16">float16</option>
                    <option value="int8">int8</option>
                    <option value="int4">int4</option>
                  </select>
                  {selectedQuantization && (
                    <p>The model will be loaded in: {selectedQuantization}</p>
                  )}
                </>
              )}

              <Link
                className="text-center font-bold border-4 border-secondary-700 rounded-md mt-2 px-2"
                href={{
                  pathname: '/models/chat',
                  query: {
                    chat_type: ChatType.CHAT,
                    ai_model_id: String(selectedModel?.ai_model_id),
                    quantization:
                      ggufFileNames.length > 0 ? 'gguf' : selectedQuantization,
                    gguf_file_name:
                      selectedGGUFFileName ||
                      (ggufFileNames.length > 0 && ggufFileNames[0]),
                  },
                }}
              >
                Chat
              </Link>
              <Link
                className="text-center font-bold border-4 border-secondary-700 rounded-md mt-2 px-2"
                href={{
                  pathname: '/models/chat',
                  query: {
                    chat_type: ChatType.TEXT_GENERATION,
                    ai_model_id: String(selectedModel?.ai_model_id),
                    quantization:
                      ggufFileNames.length > 0 ? 'gguf' : selectedQuantization,
                    gguf_file_name:
                      selectedGGUFFileName ||
                      (ggufFileNames.length > 0 && ggufFileNames[0]),
                  },
                }}
              >
                Text Generation
              </Link>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
