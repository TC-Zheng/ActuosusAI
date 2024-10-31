import React, { Dispatch } from 'react';
import {
  baseChatAction,
  WordProbList,
} from '@/app/models/chat/hooks/chatReducer';

interface WordDropdownProps {
  wordProbList: WordProbList;
  onWordClick: () => void;
  onWordPick: (word: string) => void;
  onRefreshClick: () => void;
  isOpen: boolean;
  dispatch: Dispatch<baseChatAction>;
  probHeatMap: boolean;
}

export default function WordDropdown({
  wordProbList,
  onWordClick,
  onWordPick,
  onRefreshClick,
  isOpen,
  dispatch,
  probHeatMap = true,
}: WordDropdownProps) {
  if (wordProbList === undefined || wordProbList === null) {
    return <></>;
  }
  const formatWordText = (word: [string, number]) => {
    const [text, value] = word;

    if (value === -1) {
      return (
        <>
          {text + '\n'} <span className="text-accent-600">Previous</span>
        </>
      );
    }
    if (value === -2) {
      return text;
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
          onClick={(e) => {
            e.stopPropagation();
            onWordClick();
          }}
          className={getButtonStyle(isOpen, wordProbList, probHeatMap)}
        >
          {wordProbList[0][0].replace(/\n/g, '')}
        </button>
        {isOpen && (
          <div className="z-20 absolute bg-background-300 mt-2 w-32 origin-top-right backdrop-blur-md border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none flex flex-col">
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

const getButtonStyle = (
  isOpen: boolean,
  wordProbList: WordProbList,
  probHeatMap: boolean
) => {
  const baseStyle = 'hover:text-primary-400 rounded-md';
  const selectedStyle = isOpen ? ' text-accent-600' : '';
  const previousStyle =
    wordProbList.length > 1 && wordProbList[1][1] === -1
      ? ' border-2 border-accent-500'
      : '';
  let heatMapStyle = '';
  if (probHeatMap) {
    switch (wordProbList.length) {
      case 1:
        heatMapStyle = ' text-primary-950 cursor-default'; // Neutral
        break;
      case 2:
        heatMapStyle = ' text-blue-900';
        break;
      case 3:
        heatMapStyle = ' text-blue-800';
        break;
      case 4:
        heatMapStyle = ' text-blue-700';
        break;
      case 5:
        heatMapStyle = ' text-blue-600';
        break;
      case 6:
        heatMapStyle = ' text-yellow-600'; // Start warming up
        break;
      case 7:
        heatMapStyle = ' text-yellow-700';
        break;
      case 8:
        heatMapStyle = ' text-orange-700';
        break;
      case 9:
        heatMapStyle = ' text-orange-800'; // High heat
        break;
      case 10:
        heatMapStyle = ' text-red-700'; // Maximum heat
        break;
      default:
        heatMapStyle = ' text-red-800'; // Exceeding maximum
    }
  }
  return baseStyle + selectedStyle + previousStyle + heatMapStyle;
};
