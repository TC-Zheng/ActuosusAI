import React, { Dispatch, useLayoutEffect, useRef, useState } from 'react';
import {
  baseChatAction,
  WordProbList,
  WordStatus,
} from '@/app/models/chat/hooks/chatReducer';

interface WordDropdownProps {
  wordProbList: WordProbList;
  onWordClick: () => void;
  onWordPick: (word: string) => void;
  onRefreshClick: () => void;
  isOpen: boolean;
  dispatch: Dispatch<baseChatAction>;
  heatMapColor: string;
}

export default function WordDropdown({
  wordProbList,
  onWordClick,
  onWordPick,
  onRefreshClick,
  isOpen,
  dispatch,
  heatMapColor = '',
}: WordDropdownProps) {
  const [isUpward, setIsUpward] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Check if the button is below the middle of the screen
      if (rect.top > viewportHeight / 2) {
        setIsUpward(true);
      } else {
        setIsUpward(false);
      }
    }
  }, [isOpen]);

  const formatWordText = (word: [string, number]) => {
    const [text, value] = word;

    if (value === WordStatus.PREVIOUS) {
      return (
        <>
          {text + '\n'} <span className="text-accent-600">Previous</span>
        </>
      );
    }
    if (value === WordStatus.PICKED) {
      return text;
    }

    const percentage = value * 100;
    const formattedValue =
      percentage < 0.01 ? value.toExponential(2) : `${percentage.toFixed(2)}%`;

    return `${text.replace(/\n/g, '\\n')} ${formattedValue}`;
  };

  const containPreviousSelected =
    wordProbList.length > 1 && wordProbList[1][1] === WordStatus.PREVIOUS;

  if (wordProbList.length > 1 && wordProbList[0][0] === wordProbList[1][0]) {
    wordProbList = wordProbList.slice(1);
  }

  return (
    <>
      <div
        className={'inline whitespace-pre-wrap relative'}
        style={{
          background: heatMapColor,
          transition: 'background 0.3s ease',
        }}
      >
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            onWordClick();
          }}
          className={getButtonStyle(isOpen, wordProbList)}
        >
          {wordProbList[0][0].replace(/\n/g, '')}
        </button>
        {isOpen && (
          <div
            className={`z-20 absolute bg-background-300 mt-2 w-32 origin-top-right backdrop-blur-md border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none flex flex-col ${
              isUpward ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          >
            {!containPreviousSelected && (
              <button
                className="bg-background-300 cursor-pointer hover:text-secondary-700 rounded-md"
                onClick={(e) => {
                  e.stopPropagation();
                  onRefreshClick();
                }}
              >
                Refresh
              </button>
            )}
            {wordProbList.map((word) => (
              <button
                key={word[0]}
                className="bg-background-300 cursor-pointer hover:text-secondary-700 rounded-md"
                onClick={(e) => {
                  e.stopPropagation();
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

const getButtonStyle = (isOpen: boolean, wordProbList: WordProbList) => {
  const baseStyle = 'hover:text-primary-400 inline-block block';
  const selectedStyle = isOpen ? ' text-accent-600' : '';
  const previousStyle =
    wordProbList.length > 1 && wordProbList[1][1] === WordStatus.PREVIOUS
      ? ' border-2 border-accent-500'
      : '';
  return baseStyle + selectedStyle + previousStyle;
};
