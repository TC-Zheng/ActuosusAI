// components/WordDropdown.tsx
import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';

interface WordDropdownProps {
  word: string;
  alternatives: string[];
  onSelect: (selectedWord: string) => void;
}

export const WordDropdown = ({
  word,
  alternatives,
  onSelect,
}: WordDropdownProps) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-black hover:bg-gray-200">
          {word}
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute z-10 mt-2 w-32 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none">
          {alternatives.map((altWord, index) => (
            <Menu.Item key={index}>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } group flex items-center px-4 py-2 text-sm text-gray-700 w-full`}
                  onClick={() => onSelect(altWord)}
                >
                  {altWord}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
