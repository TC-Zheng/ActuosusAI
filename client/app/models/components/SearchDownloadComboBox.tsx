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
    <div className="mx-auto h-12 w-96 pt-5 flex flex-col justify-center">
      <Combobox
        value={selectedSearchName}
        onChange={(value) => setSelectedSearchName(value ?? '')}
        // onClose={() => setQuery('')}
      >
        <div className="relative flex flex-col mt-4">
          <div className="relative w-full justify-center">
            <ComboboxInput
              className={clsx(
                'w-full rounded-lg border-secondary-700 bg-primary-100 py-1.5 pr-8 pl-3 text-sm/6',
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
              <CloseIcon className="fill-primary-700" />
            </button>
          </div>
        </div>

        <ComboboxOptions
          anchor="bottom"
          transition
          className={clsx(
            'w-[var(--input-width)] rounded-xl bg-primary-200 p-1 [--anchor-gap:var(--spacing-1)] empty:invisible',
            'transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0',
            'bg-opacity-50 backdrop-blur-md'
          )}
        >
          {model_names.map((name) => (
            <ComboboxOption
              key={name}
              value={name}
              className="group flex cursor-pointer items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-primary-300"
            >
              <div className="text-sm/6 text-primary-800">{name}</div>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
      <button
        onClick={onDownloadModelClick}
        className={clsx(
          'flex flex-row px-4 py-0.5 bg-background-500 text-primary-200 rounded-md mx-auto text-center mt-2',
          downloadModelLoading ? 'cursor-not-allowed' : 'cursor-pointer'
        )}
        disabled={downloadModelLoading}
      >
        {downloadModelLoading ? (
          <>
            <LoaderIcon className="h-4 w-4 animate-spin my-2 mr-2 fill-current text-primary-100" />
            Downloading...{' '}
          </>
        ) : (
          <>Download</>
        )}
      </button>
    </div>
  );
}
