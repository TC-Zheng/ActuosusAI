interface WordDropdownProps {
  wordList: [string, number][];
  onWordClick: () => void;
  onWordPick: (word: string) => void;
  onRefreshClick: () => void;
  isOpen: boolean;
}

export default function WordDropdown({
  wordList,
  onWordClick,
  onWordPick,
  onRefreshClick,
  isOpen,
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
  const containPreviousSelected = wordList.length > 1 && wordList[1][1] === -1;
  // Remove the first element of wordList if it is the same as the second element, this might happen with refresh button
  if (wordList.length > 1 && wordList[0][0] === wordList[1][0]) {
    wordList = wordList.slice(1);
  }

  return (
    <>
      <div className="inline whitespace-pre-wrap relative">
        <button
          onClick={() => onWordClick()}
          className={
            'hover:text-primary-400 ' +
            (isOpen
              ? 'text-accent-600'
              : wordList.length > 1 && wordList[1][1] === -1
                ? 'text-secondary-600'
                : '')
          }
        >
          {wordList[0][0]}
        </button>
        {isOpen && (
          <div className="z-10 absolute bg-background-300 mt-2 w-32 origin-top-right backdrop-blur-md border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none flex flex-col">
            {!containPreviousSelected && (
              <button
                className="bg-background-300 cursor-pointer hover:text-secondary-700 rounded-md"
                onClick={() => onRefreshClick()}
              >
                Refresh
              </button>
            )}
            {wordList.map((word) => (
              <button
                key={word[0]}
                className="bg-background-300 cursor-pointer hover:text-secondary-700 rounded-md"
                onClick={() => onWordPick(word[0])}
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
