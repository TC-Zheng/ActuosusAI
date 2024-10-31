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
}

const MessagesDisplay: React.FC<MessagesDisplayProps> = ({
  state,
  dispatch,
  onWordPick,
  onRefreshClick,
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevHeight = useRef(0);
  useEffect(() => {
    if (divRef.current) {
      if (prevHeight.current < divRef.current.scrollHeight) {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
      prevHeight.current = divRef.current.scrollHeight;
    }
  }, [state.messages, state.openedWord_i, state.openedWord_j]);

  return (
    <div
      className="flex flex-col pr-4 mr-8 mt-8 h-screen overflow-y-scroll custom-scrollbar"
      onClick={() => {
        dispatch({ type: 'SET_OPENED_WORD', i: -1, j: -1 });
      }}
      ref={divRef}
    >
      {state.messages.map((message, i) => {
        if (message.source === 'user') {
          return (
            <p
              className="ml-auto bg-background-400 rounded-md p-2 z-10 whitespace-pre-wrap"
              key={i}
            >
              {message.content[0]}
            </p>
          );
        } else {
          return (
            <div key={i} className="flex flex-wrap mx-20 min-w-32">
              {message.content.flatMap((item, j) => {
                if (
                  item === '\n' ||
                  (typeof item !== 'string' && item[0][0].includes('\n'))
                ) {
                  // Add a line break if the word contains a newline character
                  return [
                    typeof item === 'string' ? null : (
                      <WordDropdown
                        key={j}
                        dispatch={dispatch}
                        isOpen={
                          state.openedWord_i === i && state.openedWord_j === j
                        }
                        wordProbList={item}
                        onWordClick={() =>
                          state.openedWord_i === i && state.openedWord_j === j
                            ? dispatch({
                                type: 'SET_OPENED_WORD',
                                i: -1,
                                j: -1,
                              })
                            : dispatch({
                                type: 'SET_OPENED_WORD',
                                i: i,
                                j: j,
                              })
                        }
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
                      key={j}
                      dispatch={dispatch}
                      isOpen={
                        state.openedWord_i === i && state.openedWord_j === j
                      }
                      wordProbList={item}
                      onWordClick={() =>
                        state.openedWord_i === i && state.openedWord_j === j
                          ? dispatch({ type: 'SET_OPENED_WORD', i: -1, j: -1 })
                          : dispatch({
                              type: 'SET_OPENED_WORD',
                              i: i,
                              j: j,
                            })
                      }
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
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessagesDisplay;
