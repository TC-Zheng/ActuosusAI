'use client';
import React, {
  useCallback,
  Suspense,
  useMemo,
  Dispatch,
  useRef,
  useEffect,
} from 'react';
import WordDropdown from '@/app/models/text_generation/components/WordDropdown';
import { useWebsocket } from '@/app/hooks/useWebsocket';
import Loader from '@/app/components/Loader';
import { useSearchParams } from 'next/navigation';
import useChatReducer, {
  baseChatAction,
  baseChatState,
  Message,
} from '@/app/models/hooks/chatReducer';
import ChatSidePanel from '@/app/models/components/ChatSidePanel';

type WordProbList = Array<[string, number]>;
type TextGenerationResponse = {
  response: WordProbList;
  end: boolean;
};
export enum ChatType {
  TEXT_GENERATION = 'text_generation',
  CHAT = 'chat',
}

type NewMessageRequest = {
  type_id: 0;
  content: string;
  source: string;
  i: number;
  j: number;
};

type SelectWordRequest = {
  type_id: 1;
  i: number;
  j: number;
  new_word: string;
};

type ChangeConfigRequest = {
  type_id: 2;
  config_name: string;
  config_value: string;
};

type RefreshWordRequest = {
  type_id: 3;
  i: number;
  j: number;
};

type ChatRequest =
  | NewMessageRequest
  | SelectWordRequest
  | ChangeConfigRequest
  | RefreshWordRequest;

enum responseTypeId {
  MODEL_INFO = 0,
  NEW_MESSAGE = 1,
  NEW_MESSAGE_END = 2,
  REFRESH_WORD = 3,
}

const Page = () => {
  return (
    <Suspense fallback={<Loader />}>
      <WebSocketComponent />
    </Suspense>
  );
};

const WebSocketComponent = () => {
  const [state, dispatch] = useChatReducer();
  const searchParams = useSearchParams();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [state.inputMessage]);
  const queryString = new URLSearchParams({
    chat_type: `${searchParams.get('chat_type')}`,
    ai_model_id: `${searchParams.get('ai_model_id')}`,
    quantization: `${searchParams.get('quantization')}`,
    gguf_file_name: `${searchParams.get('gguf_file_name')}`,
  }).toString();
  // const loading = state.ai_model_name === '';
  const loading = false;
  state.messages = [
    { content: ['hello, I am mario'], source: 'user' },
    {
      content: [
        'hi',
        [
          ['I am', 0.5],
          ['I will', 0.5],
        ],
        [
          ['how', 0.8],
          ['I', -1],
        ],
        '-----------------------------------------------------------------------------------------------------------------------------------------------',
        '--------------------------------------------------------------------------------------------------------',
        '--------------------------------------------------------------------------------------------------------',
      ],
      source: 'ai',
    },
    { content: ['how are you'], source: 'user' },
  ];

  const memoizedOptions = useMemo(
    () => ({
      onMessage: (message: MessageEvent) => {
        const data = JSON.parse(message.data);
        switch (data.type_id) {
          case responseTypeId.MODEL_INFO:
            dispatch({
              type: 'SET_MODEL_INFO',
              payload: data.payload,
            });
            break;
          case responseTypeId.NEW_MESSAGE:
            dispatch({
              type: 'APPEND_TO_LAST_MESSAGE',
              content: data.content,
              source: data.source,
            });
            break;
          case responseTypeId.NEW_MESSAGE_END:
            dispatch({
              type: 'INSERT_TRIE',
            });
            break;
          case responseTypeId.REFRESH_WORD:
            dispatch({
              type: 'REFRESH_WORD_AT',
              i: data.i,
              j: data.j,
              wordProbList: data.wordProbList,
            });
            break;
        }
      },
    }),
    [dispatch]
  );

  const memoizedUrl = useMemo(
    () => `ws://127.0.0.1:8000/ws/chat/?${queryString}`,
    [queryString]
  );

  const { sendToWebsocket, isConnected } = useWebsocket(
    memoizedUrl,
    memoizedOptions
  );

  // Send message function
  const sendRequest = useCallback(
    (request: ChatRequest) => {
      sendToWebsocket(JSON.stringify(request));
    },
    [sendToWebsocket]
  );

  const handleWordPick = useCallback(
    (i: number, j: number, word: string) => {
      // Check if the whole words tree up to word is in the trie already
      const slicedMessage = messagesUpTo(state.messages, i, j);
      const searchResults = state.trie.searchAndReturn(slicedMessage);

      if (searchResults) {
        // If the word is in the trie, use that instead of generating new tokens
        dispatch({
          type: 'SET_MESSAGES',
          messages: searchResults,
        });
      } else {
        // If the word is not in the trie, generate new tokens
        dispatch({
          type: 'SELECT_NEW_WORD_AT',
          i: i,
          j: j,
          newWord: word,
          prevWord: slicedMessage[i].content[j][0][0],
        });

        sendRequest({
          type_id: 1,
          i: i,
          j: j,
          new_word: word,
        });
      }
    },
    [dispatch, sendRequest, state.messages, state.trie]
  );
  const handleRefresh = useCallback(
    (i: number, j: number) => {
      sendRequest({ type_id: 3, i: i, j: j } as RefreshWordRequest);
    },
    [sendRequest]
  );
  const onSendClick = () => {
    if (searchParams.get('type') === ChatType.TEXT_GENERATION) {
      dispatch({
        type: 'RESET_AND_SEND_NEW_MESSAGE',
        content: state.inputMessage,
        source: 'ai',
      });
      sendRequest({
        type_id: 0,
        content: state.inputMessage,
        source: 'ai',
        i: 0,
        j: 0,
      });
    } else if (searchParams.get('type') === ChatType.CHAT) {
      dispatch({
        type: 'SEND_NEW_MESSAGE',
        content: state.inputMessage,
        source: 'user',
      });
      sendRequest({
        type_id: 0,
        content: state.inputMessage,
        source: 'ai',
        i: -1,
        j: 0,
      });
    }
  };

  return (
    <>
      {loading && <Loader />}
      {!loading && (
        <div className="flex flex-row h-screen w-full">
          {/*An overlay purely for closing the word dropdown*/}
          <div
            className="fixed inset-0 bg-opacity-0 -z-5"
            onClick={() => {
              dispatch({ type: 'SET_OPENED_WORD', i: -1, j: -1 });
            }}
          ></div>
          <ChatSidePanel
            state={state}
            isConnected={isConnected}
            dispatch={dispatch}
          />
          <div className="flex flex-col w-full">
            <MessagesDisplay
              messages={state.messages}
              state={state}
              dispatch={dispatch}
              onWordPick={handleWordPick}
              onRefreshClick={handleRefresh}
            />
            <div className="mt-auto w-full flex flex-row p-8 pr-16 relative">
              <textarea
                ref={textAreaRef}
                value={state.inputMessage}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_INPUT_MESSAGE',
                    inputMessage: e.target.value,
                  })
                }
                placeholder="Type your message"
                className="w-full resize-none overflow-hidden pr-16"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSendClick();
                  }
                }}
              />
              <button
                onClick={onSendClick}
                className="absolute right-16 bottom-8 mr-2"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Page;

const messagesUpTo = (messages: Message[], i: number, j: number) => {
  const m = messages.slice(0, i + 1);
  m[i] = { ...m[i], content: m[i].content.slice(0, j + 1) };
  return m;
};

interface MessagesDisplayProps {
  messages: Message[];
  state: baseChatState;
  dispatch: Dispatch<baseChatAction>;
  onWordPick: (i: number, j: number, word: string) => void;
  onRefreshClick: (i: number, j: number) => void;
}

const MessagesDisplay: React.FC<MessagesDisplayProps> = ({
  messages,
  state,
  dispatch,
  onWordPick,
  onRefreshClick,
}) => {
  return (
    <div className="flex flex-col mr-32 mt-28">
      {messages.map((message, i) => {
        if (message.source === 'user') {
          return (
            <p
              className="ml-auto bg-background-400 rounded-md p-2 z-10"
              key={i}
            >
              {message.content[0]}
            </p>
          );
        } else {
          return (
            <div key={i} className="flex flex-wrap m-20 min-w-32">
              {message.content.map((item, j) => {
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
    </div>
  );
};
