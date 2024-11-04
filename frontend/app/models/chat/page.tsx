'use client';
import React, { Suspense, useMemo, useRef, useEffect } from 'react';
import { useWebsocket } from '@/app/hooks/useWebsocket';
import Loader from '@/app/components/Loader';
import { useSearchParams } from 'next/navigation';
import useChatReducer, { Message } from '@/app/models/chat/hooks/chatReducer';
import ChatSidePanel from '@/app/models/chat/components/ChatSidePanel';
import MessagesDisplay from '@/app/models/chat/components/MessageDisplay';
import { error_toast, useDebounce } from '@/app/utils/utils';
import { ChatType } from '@/app/models/chat/constants';
import { wsURL } from '@/app/utils/constants';

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

type ClearMessagesRequest = {
  type_id: 4;
};

type ChatRequest =
  | NewMessageRequest
  | SelectWordRequest
  | ChangeConfigRequest
  | RefreshWordRequest
  | ClearMessagesRequest;

enum responseTypeId {
  ERROR = -1,
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
  const loading = state.ai_model_name === '';

  const memoizedOptions = useMemo(
    () => ({
      onMessage: (message: MessageEvent) => {
        const data = JSON.parse(message.data);
        switch (data.type_id) {
          case responseTypeId.ERROR:
            error_toast(data.payload);
            break;
          case responseTypeId.MODEL_INFO:
            dispatch({
              type: 'SET_MODEL_INFO',
              payload: data.payload,
            });
            break;
          case responseTypeId.NEW_MESSAGE:
            dispatch({
              type: 'APPEND_TO_LAST_MESSAGE',
              payload: data.payload,
            });
            break;
          case responseTypeId.NEW_MESSAGE_END:
            dispatch({
              type: 'MESSAGE_END',
              payload: data.payload,
            });
            break;
          case responseTypeId.REFRESH_WORD:
            dispatch({
              type: 'REFRESH_WORD_AT',
              payload: data.payload,
            });
            break;
        }
      },
    }),
    [dispatch]
  );

  const memoizedUrl = useMemo(
    () => `${wsURL}/ws/chat/?${queryString}`,
    [queryString]
  );

  const { sendToWebsocket, isConnected } = useWebsocket(
    memoizedUrl,
    memoizedOptions
  );

  // Send message function
  const sendRequest = (request: ChatRequest) => {
    sendToWebsocket(JSON.stringify(request));
  };

  const handleConfigChange = useDebounce(
    (config_name: string, config_value: string) => {
      sendRequest({
        type_id: 2,
        config_name: config_name,
        config_value: config_value,
      });
    },
    200
  );

  const handleWordPick = (i: number, j: number, word: string) => {
    // Check if the whole words tree up to word is in the trie already
    const slicedMessage = messagesUpTo(state.messages, i, j - 1);
    slicedMessage.at(-1)!.content.push(word);
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
        prevWord: state.messages[i].content[j][0][0],
      });
      sendRequest({
        type_id: 1,
        i: i,
        j: j,
        new_word: word,
      });
    }
  };

  const handleRefresh = (i: number, j: number) => {
    sendRequest({ type_id: 3, i: i, j: j } as RefreshWordRequest);
  };

  const onSendClick = () => {
    if (searchParams.get('chat_type') === ChatType.TEXT_GENERATION) {
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
    } else if (searchParams.get('chat_type') === ChatType.CHAT) {
      dispatch({
        type: 'SEND_NEW_MESSAGE',
        content: state.inputMessage,
        source: 'user',
      });
      sendRequest({
        type_id: 0,
        content: state.inputMessage,
        source: 'user',
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
          <ChatSidePanel
            state={state}
            isConnected={isConnected}
            dispatch={dispatch}
            onConfigChange={handleConfigChange}
            onClearClick={() => sendRequest({ type_id: 4 })}
          />
          <div className="flex flex-col w-full">
            <MessagesDisplay
              state={state}
              dispatch={dispatch}
              onWordPick={handleWordPick}
              onRefreshClick={handleRefresh}
              onContinueClick={() =>
                sendRequest({
                  type_id: 0,
                  content: '',
                  source: 'ai',
                  i: -1,
                  j: -1,
                })
              }
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
