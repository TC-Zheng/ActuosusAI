import { baseChatAction, WordProbList } from '@/app/models/hooks/chatReducer';
import React, { Dispatch } from 'react';

interface WordDropdownProps {
  wordProbList: WordProbList;
  onWordClick: () => void;
  onWordPick: (word: string) => void;
  onRefreshClick: () => void;
  isOpen: boolean;
  dispatch: Dispatch<baseChatAction>;
}

export default function WordDropdown({
  wordProbList,
  onWordClick,
  onWordPick,
  onRefreshClick,
  isOpen,
  dispatch,
}: WordDropdownProps) {
  const formatWordText = (word: [string, number]): string => {
    const [text, value] = word;

    if (value === -1) {
      return text + '\nPrevious selected';
    }

    const percentage = value * 100;
    const formattedValue =
      percentage < 0.01 ? value.toExponential(2) : `${percentage.toFixed(2)}%`;

    return `${text} ${formattedValue}`;
  };
  const containPreviousSelected =
    wordProbList.length > 1 && wordProbList[1][1] === -1;
  // Remove the first element of wordList if it is the same as the second element, this might happen with refresh button
  if (wordProbList.length > 1 && wordProbList[0][0] === wordProbList[1][0]) {
    wordProbList = wordProbList.slice(1);
  }

  return (
    <>
      <div className="inline whitespace-pre-wrap relative">
        <button
          onClick={() => onWordClick()}
          className={
            'hover:text-primary-400 rounded-md select-text ' +
            (isOpen
              ? 'text-accent-600'
              : wordProbList.length > 1 && wordProbList[1][1] === -1
                ? 'bg-accent-100'
                : '')
          }
        >
          {wordProbList[0][0]}
        </button>
        {isOpen && (
          <div className="z-20 absolute bg-background-300 mt-2 w-32 origin-top-right backdrop-blur-md border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none flex flex-col">
            {!containPreviousSelected && (
              <button
                className="bg-background-300 cursor-pointer hover:text-secondary-700 rounded-md"
                onClick={() => onRefreshClick()}
              >
                Refresh
              </button>
            )}
            {wordProbList.map((word) => (
              <button
                key={word[0]}
                className="bg-background-300 cursor-pointer hover:text-secondary-700 rounded-md"
                onClick={() => {
                  if (word[0] !== wordProbList[0][0]) {
                    onWordPick(word[0]);
                  }
                }}
              >
                {formatWordText(word)}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
