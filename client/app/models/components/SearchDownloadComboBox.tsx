import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import clsx from 'clsx';
import CloseIcon from '@/app/public/icon/close.svg';
import LoaderIcon from '@/app/public/icon/loader.svg';
import React from 'react';

export type SearchDownloadComboBoxProps = {
  selectedSearchName: string;
  setSelectedSearchName: (value: string) => void;
  model_names: Array<string>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadModelClick: (e: React.FormEvent) => void;
  downloadModelLoading: boolean;
};
export default function SearchDownloadComboBox({
  selectedSearchName,
  setSelectedSearchName,
  model_names,
  onInputChange,
  onDownloadModelClick,
  downloadModelLoading,
}: SearchDownloadComboBoxProps) {
  return (
    <div className="mx-auto h-12 w-96 pt-5">
      <Combobox
        value={selectedSearchName}
        onChange={(value) => setSelectedSearchName(value ?? '')}
        // onClose={() => setQuery('')}
      >
        <div className="flex flex-row">
          <div className="relative w-64">
            <ComboboxInput
              className={clsx(
                'w-full rounded-lg border-none bg-white/5 py-1.5 pr-8 pl-3 text-sm/6 text-white',
                'focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25'
              )}
              displayValue={(input: string) => input}
              placeholder={'Search for a model'}
              onChange={onInputChange}
              spellCheck={false}
            />
            <button
              className="absolute right-2 my-2"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSearchName('');
              }}
            >
              <CloseIcon className="fill-primary-500" />
            </button>
          </div>
          <button
            onClick={onDownloadModelClick}
            className={clsx(
              'flex flex-row px-4 py-0.5 bg-background-500 text-primary-200 rounded-md',
              downloadModelLoading ? 'cursor-not-allowed' : 'cursor-pointer'
            )}
            disabled={downloadModelLoading}
          >
            {downloadModelLoading ? (
              <>
                <LoaderIcon className="h-4 w-4 animate-spin my-2 mr-2" />
                Downloading...{' '}
              </>
            ) : (
              <>Download</>
            )}
          </button>
        </div>

        <ComboboxOptions
          anchor="bottom"
          transition
          className={clsx(
            'w-[var(--input-width)] rounded-xl border border-white/5 bg-white/5 p-1 [--anchor-gap:var(--spacing-1)] empty:invisible',
            'transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0',
            'bg-opacity-50 backdrop-blur-md'
          )}
        >
          {model_names.map((name) => (
            <ComboboxOption
              key={name}
              value={name}
              className="group flex cursor-pointer items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
            >
              <div className="text-sm/6 text-white">{name}</div>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}
