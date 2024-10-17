import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

interface WordDropdownProps {
  wordList: [string, number][];
  index: number;
  OnWordClick: (index: number, word: string) => void;
}

function formatWordText(word: [string, number]): string {
  const [text, value] = word;

  if (value === -1) {
    return text + '\nPrevious selected';
  }

  const percentage = value * 100;
  const formattedValue =
    percentage < 0.01 ? value.toExponential(2) : `${percentage.toFixed(2)}%`;

  return `${text} ${formattedValue}`;
}

export default function WordDropdown({
  wordList,
  index,
  OnWordClick,
}: WordDropdownProps) {
  return (
    <div className="inline whitespace-pre-wrap">
      <Menu>
        {({ open }) => (
          <>
            <MenuButton
              className={
                open
                  ? 'text-accent-200'
                  : wordList.length > 1 && wordList[1][1] === -1
                    ? 'text-secondary-200'
                    : ''
              }
            >
              {wordList[0][0]}
            </MenuButton>
            <MenuItems className="absolute mt-2 w-32 origin-top-right bg-white backdrop-blur-md border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none flex flex-col">
              {wordList.map((word) => (
                <MenuItem key={word[0]}>
                  <button
                    className="bg-background-500"
                    onClick={() => OnWordClick(index, word[0])}
                  >
                    {formatWordText(word)}
                  </button>
                </MenuItem>
              ))}
            </MenuItems>
          </>
        )}
      </Menu>
    </div>
  );
}
