import React, { Dispatch, useEffect, useRef } from 'react';
import {
  baseChatAction,
  baseChatState,
} from '@/app/models/chat/hooks/chatReducer';
import WordDropdown from '@/app/models/chat/components/WordDropdown';

interface MessagesDisplayProps {
  state: baseChatState;
  dispatch: Dispatch<baseChatAction>;
  onWordPick: (i: number, j: number, word: string) => void;
  onRefreshClick: (i: number, j: number) => void;
  onContinueClick: () => void;
}

const MessagesDisplay: React.FC<MessagesDisplayProps> = ({
  state,
  dispatch,
  onWordPick,
  onRefreshClick,
  onContinueClick,
}) => {
  const messagesEndRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.messages]);

  const handleWordClick = (i: number, j: number) => {
    if (state.openedWord_i === i && state.openedWord_j === j) {
      dispatch({
        type: 'SET_OPENED_WORD',
        i: -1,
        j: -1,
      });
    } else {
      dispatch({
        type: 'SET_OPENED_WORD',
        i: i,
        j: j,
      });
    }
  };

  return (
    <div
      className="flex flex-col pr-4 mt-8 h-screen overflow-y-scroll custom-scrollbar"
      onClick={() => {
        dispatch({ type: 'SET_OPENED_WORD', i: -1, j: -1 });
      }}
    >
      {state.messages.map((message, i) => {
        if (message.source === 'user') {
          return (
            <div className="ml-auto" key={i}>
              <p className="mr-16 ml-32 bg-background-400 rounded-md p-2 z-10 whitespace-pre-wrap">
                {message.content[0]}
              </p>
            </div>
          );
        } else {
          return (
            <div key={i} className="flex flex-wrap mx-20 min-w-32">
              {message.content
                .map((word) => {
                  if (typeof word === 'string') {
                    return word;
                  } else {
                    return word.filter(
                      (word, index) => index === 0 || word[1] > state.minProb
                    );
                  }
                })
                .flatMap((item, j) => {
                  // Generate the heatmap color based on the probability
                  let heatMapColor = '';
                  if (
                    typeof item === 'string' ||
                    item.length === 1 ||
                    !state.showHeatMap
                  ) {
                    heatMapColor = '';
                  } else {
                    const prevItem = message.content[j - 1];
                    const nextItem = message.content[j + 1];
                    const prevTemp =
                      typeof prevItem === 'string'
                        ? 0
                        : prevItem?.filter((word) => word[1] > state.minProb)
                            ?.length;
                    const nextTemp =
                      typeof nextItem === 'string'
                        ? 0
                        : nextItem?.filter((word) => word[1] > state.minProb)
                            ?.length;

                    heatMapColor = generateGradient(
                      prevTemp,
                      item.length,
                      nextTemp
                    );
                  }
                  if (
                    item === '\n' ||
                    (typeof item !== 'string' && item[0][0].includes('\n'))
                  ) {
                    // Add a line break if the word contains a newline character
                    return [
                      typeof item === 'string' ? null : (
                        <WordDropdown
                          key={j}
                          heatMapColor={heatMapColor}
                          dispatch={dispatch}
                          isOpen={
                            state.openedWord_i === i && state.openedWord_j === j
                          }
                          wordProbList={item}
                          onWordClick={() => handleWordClick(i, j)}
                          onWordPick={(word) => onWordPick(i, j, word)}
                          onRefreshClick={() => onRefreshClick(i, j)}
                        />
                      ),
                      <div className="w-full" key={`line-break-${j}`}></div>,
                    ].filter(Boolean);
                  }
                  if (typeof item === 'string') {
                    return (
                      <p
                        className="z-10"
                        onClick={() => {
                          dispatch({ type: 'SET_OPENED_WORD', i: -1, j: -1 });
                        }}
                        key={j}
                      >
                        {item}
                      </p>
                    );
                  } else {
                    return (
                      <WordDropdown
                        heatMapColor={heatMapColor}
                        key={j}
                        dispatch={dispatch}
                        isOpen={
                          state.openedWord_i === i && state.openedWord_j === j
                        }
                        wordProbList={item}
                        onWordClick={() => handleWordClick(i, j)}
                        onWordPick={(word) => onWordPick(i, j, word)}
                        onRefreshClick={() => onRefreshClick(i, j)}
                      />
                    );
                  }
                })}
            </div>
          );
        }
      })}
      {state.showContinueGenerate && (
        <button ref={messagesEndRef} className="text-secondary-800" onClick={onContinueClick}>
          Continue Generate
        </button>
      )}
    </div>
  );
};
// Define base HSL colors for each temperature (1-10)
// Using HSL for easier interpolation
// Format: [hue, saturation%, lightness%]
const baseColors: { [key: number]: number[] } = {
  0: [0, 0, 90], // neutral-200
  1: [0, 0, 90], // neutral-200
  2: [210, 30, 85], // slight blue tint
  3: [210, 60, 80], // light blue
  4: [210, 90, 75], // stronger blue
  5: [60, 80, 70], // yellow
  6: [45, 85, 65], // light orange
  7: [30, 90, 60], // orange
  8: [15, 95, 55], // orange-red
  9: [0, 100, 50], // red
  10: [0, 100, 45], // deep red
};

const getColor = (temp: number): number[] => {
  if (temp > 10) {
    return baseColors[10]; // deep red for any temperature greater than 10
  }
  return baseColors[temp];
};

// Helper function to interpolate between two HSL colors with a longer transition
// larger steps will result in a smoother gradient
const interpolateHSL = (
  color1: number[],
  color2: number[],
  factor: number,
  steps = 5
) => {
  let hue1 = color1[0];
  let hue2 = color2[0];

  if (Math.abs(hue2 - hue1) > 180) {
    if (hue1 < hue2) {
      hue1 += 360;
    } else {
      hue2 += 360;
    }
  }

  const adjustedFactor = factor / steps;
  const hue = (hue1 + (hue2 - hue1) * adjustedFactor) % 360;
  const saturation = color1[1] + (color2[1] - color1[1]) * adjustedFactor;
  const lightness = color1[2] + (color2[2] - color1[2]) * adjustedFactor;

  return [hue, saturation, lightness];
};

// Helper function to generate gradient string with transparency
// alpha is the transparency value (0-1)
const generateGradient = (
  prevTemp: number,
  currentTemp: number,
  nextTemp: number,
  alpha = 0.3
) => {
  if (prevTemp === undefined) {
    prevTemp = currentTemp;
  }
  if (nextTemp === undefined) {
    nextTemp = currentTemp;
  }
  const currentColor = getColor(currentTemp);
  const prevColor = getColor(prevTemp);
  const nextColor = getColor(nextTemp);

  const stops = [];

  let midColor = interpolateHSL(prevColor, currentColor, 0.5);
  stops.push(
    `hsla(${midColor[0]}, ${midColor[1]}%, ${midColor[2]}%, ${alpha}) 0%`
  );

  stops.push(
    `hsla(${currentColor[0]}, ${currentColor[1]}%, ${currentColor[2]}%, ${alpha}) 50%`
  );

  midColor =
    nextTemp === 1
      ? interpolateHSL(nextColor, currentColor, 0.5)
      : interpolateHSL(currentColor, nextColor, 0.5);
  stops.push(
    `hsla(${midColor[0]}, ${midColor[1]}%, ${midColor[2]}%, ${alpha}) 100%`
  );
  return `linear-gradient(to right, ${stops.join(', ')})`;
};

export default MessagesDisplay;
