import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

interface WordDropdownProps {
  wordList: [string, number][];
}

export default function WordDropdown({ wordList }: WordDropdownProps) {
  return (
    <div className="inline whitespace-pre-wrap">
      <Menu>
        <MenuButton className="data-[focus]:outline-1 data-[focus]:outline-white">
          {wordList[0][0]}
        </MenuButton>
        <MenuItems className="absolute mt-2 w-32 origin-top-right bg-white backdrop-blur-md border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none flex flex-col">
          {wordList.map((word) => (
            <MenuItem key={word[0]}>
              <button className="bg-background-500">
                {`${word[0]} ${word[1] * 100 < 0.01 ? word[1].toExponential(2) : `${(word[1] * 100).toFixed(2)}%`}`}
              </button>
            </MenuItem>
          ))}
        </MenuItems>
      </Menu>
    </div>
  );
}
