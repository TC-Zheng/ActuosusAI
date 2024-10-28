'use client';
import { useEffect, useRef, useCallback, Suspense, useMemo } from 'react';
import WordDropdown from '@/app/models/text_generation/components/WordDropdown';
import useMessageTrie from '@/app/models/text_generation/hooks/useMessageTrie';
import { useWebsocket } from '@/app/hooks/useWebsocket';
import Loader from '@/app/components/Loader';
import { useSearchParams } from 'next/navigation';
import useChatReducer from '@/app/models/hooks/chatReducer';
import ChatSidePanel from '@/app/models/components/ChatSidePanel';

type WordProbList = Array<[string, number]>;
type TextGenerationResponse = {
  response: WordProbList;
  end: boolean;
};

const Page = () => {
  return (
    <Suspense fallback={<Loader />}>
      <WebSocketComponent />
    </Suspense>
  );
};

const WebSocketComponent = () => {
  const refreshingAt = useRef<number | null>(null);
  // This really should have been a state, but I need to use it in the onmessage closure
  const isLoadingModel = useRef<boolean>(true);
  const { insertTrie, searchTrie, clearTrie } = useMessageTrie();
  const [state, dispatch] = useChatReducer();
  const searchParams = useSearchParams();
  const queryString = new URLSearchParams({
    ai_model_id: `${searchParams.get('ai_model_id')}`,
    quantization: `${searchParams.get('quantization')}`,
    gguf_file_name: `${searchParams.get('gguf_file_name')}`,
  }).toString();

  const memoizedOptions = useMemo(
    () => ({
      onMessage: (message: MessageEvent) => {
        if (isLoadingModel.current) {
          // First response is just the model info
          isLoadingModel.current = false;
          dispatch({
            type: 'SET_MODEL_INFO',
            payload: JSON.parse(message.data),
          });
        } else {
          // Subsequent responses are the text generation responses
          const data: TextGenerationResponse = JSON.parse(message.data);
          if (data.end) {
            // Indicate that the model is done generating the response
            dispatch({
              type: 'STOP_GENERATING_RESPONSE',
            });
          } else {
            if (refreshingAt.current !== null) {
              // Replace the word list at refreshingAt with the new list
              dispatch({
                type: 'UPDATE_CURRENT_WORD_PROB_LISTS_AT',
                index: refreshingAt.current,
                newWordProbList: data.response,
              });
              refreshingAt.current = null;
            } else {
              dispatch({
                type: 'APPEND_CURRENT_WORD_PROB_LISTS',
                payload: data.response,
              });
            }
          }
        }
      },
    }),
    [dispatch]
  );

  const memoizedUrl = useMemo(
    () => `ws://127.0.0.1:8000/ws/chat/?${queryString}`,
    [queryString]
  );

  const { sendMessageToWebsocket, isConnected } = useWebsocket(
    memoizedUrl,
    memoizedOptions
  );

  useEffect(() => {
    if (!state.generatingResponse) {
      // Cache the generated tokens in the trie
      insertTrie(state.currentWordProbLists);
    }
  }, [state.generatingResponse, insertTrie, state.currentWordProbLists]);

  // Send message function
  const sendMessage = useCallback(
    (message: string, temperature: number, maxNewTokens: number) => {
      console.log('Sending message:', message);
      const messageWithPayload = JSON.stringify({
        prompt: message,
        temperature: temperature,
        max_new_tokens: maxNewTokens,
      });
      sendMessageToWebsocket(messageWithPayload);
    },
    [sendMessageToWebsocket]
  );

  const handleWordPick = useCallback(
    (index: number, word: string) => {
      // Check if the whole words tree up to word is in the trie already
      const prev_words_tree = state.currentWordProbLists
        .slice(0, index)
        .map((wpList) => wpList[0][0]);
      const searchResults = searchTrie([...prev_words_tree, word]);

      if (searchResults) {
        // If the word is in the trie, use that instead of generating new tokens
        dispatch({
          type: 'SELECT_CACHED_WORD',
          cachedWordProbLists: searchResults,
        });
      } else {
        // If the word is not in the trie, generate new tokens
        dispatch({
          type: 'SELECT_NEW_WORD',
          index: index,
          prevWord: state.currentWordProbLists[index][0][0],
          newWord: word,
        });

        const newMessage =
          state.originalPrompt + prev_words_tree.join('') + word;
        sendMessage(newMessage, state.temperature, state.maxNewTokens);
      }
    },
    [
      state.currentWordProbLists,
      searchTrie,
      state.originalPrompt,
      dispatch,
      sendMessage,
      state.temperature,
      state.maxNewTokens,
    ]
  );
  const handleRefresh = useCallback(
    (index: number) => {
      refreshingAt.current = index;
      sendMessage(
        state.originalPrompt +
          state.currentWordProbLists
            .slice(0, index)
            .map((wpList) => wpList[0][0])
            .join(''),
        state.temperature,
        1 // maxNewTokens
      );
    },
    [
      state.currentWordProbLists,
      state.originalPrompt,
      sendMessage,
      state.temperature,
    ]
  );
  const onSendClick = () => {
    dispatch({ type: 'SEND_NEW_MESSAGE', inputMessage: state.inputMessage });
    clearTrie();
    sendMessage(state.inputMessage, state.temperature, state.maxNewTokens);
  };

  return (
    <>
      {isLoadingModel.current && <Loader />}
      {!isLoadingModel.current && (
        <div className="flex flex-row h-screen w-full">
          <ChatSidePanel
            state={state}
            isConnected={isConnected}
            dispatch={dispatch}
          />
          <div className="flex flex-col w-full">
            <div className="flex flex-wrap m-20">
              <text>{state.originalPrompt}</text>
              {state.currentWordProbLists.map((wordProbList, index) => (
                <WordDropdown
                  key={index}
                  index={index}
                  isOpen={state.openedWord === index}
                  wordList={wordProbList}
                  onWordClick={(index) =>
                    state.openedWord === index
                      ? dispatch({ type: 'CLOSE_OPENED_WORD' })
                      : dispatch({ type: 'SET_OPENED_WORD', payload: index })
                  }
                  onWordPick={handleWordPick}
                  handleRefresh={handleRefresh}
                />
              ))}
            </div>
            <div className="mt-auto w-full flex flex-row p-8 pr-16 relative">
              <textarea
                value={state.inputMessage}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_INPUT_MESSAGE',
                    payload: e.target.value,
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
