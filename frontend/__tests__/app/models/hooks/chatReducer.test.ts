import useChatReducer, { WordProbList, WordStatus } from '@/app/models/hooks/chatReducer';
import { act, renderHook } from '@testing-library/react';

describe('useChatReducer', () => {
  describe('APPEND_TO_LAST_MESSAGE action', () => {
    it('should append to an new source correctly', () => {
      const { result } = renderHook(() => useChatReducer());
      act(() => {
        result.current[1]({
          type: 'APPEND_TO_LAST_MESSAGE',
          content: 'test',
          source: 'user',
        });
      });
      expect(result.current[0].messages).toEqual([
        {
          content: ['test'],
          source: 'user',
        },
      ]);
    });
    it('should append to an existing source correctly', () => {
      const { result } = renderHook(() => useChatReducer());
      act(() => {
        result.current[1]({
          type: 'APPEND_TO_LAST_MESSAGE',
          content: 'test1',
          source: 'ai',
        });
      });
      expect(result.current[0].messages).toEqual([
        {
          content: ['test1'],
          source: 'ai',
        },
      ]);
      act(() => {
        result.current[1]({
          type: 'APPEND_TO_LAST_MESSAGE',
          content: 'test2',
          source: 'ai',
        });
      });
      expect(result.current[0].messages).toEqual([
        {
          content: ['test1', 'test2'],
          source: 'ai',
        },
      ]);
    });
  });
  describe('SELECT_NEW_WORD_AT action', () => {
    it('should select a new word at the specified position', () => {
      const { result } = renderHook(() => useChatReducer());

      // Initial state with one message
      act(() => {
        result.current[1]({
          type: 'APPEND_TO_LAST_MESSAGE',
          content: 'test',
          source: 'user',
        });
      });

      // Dispatch SELECT_NEW_WORD_AT action
      act(() => {
        result.current[1]({
          type: 'SELECT_NEW_WORD_AT',
          i: 0,
          j: 0,
          prevWord: 'oldWord',
          newWord: 'newWord',
        });
      });

      // Verify the state
      expect(result.current[0].messages[0].content[0]).toEqual([
        ['newWord', WordStatus.PICKED],
        ['oldWord', WordStatus.PREVIOUS],
      ]);
      expect(result.current[0].openedWord_i).toBe(-1);
      expect(result.current[0].openedWord_j).toBe(-1);
    });
  });
});

//
// describe('useChatReducer', () => {
//   describe('APPEND_NEW_AI_MESSAGE action', () => {
//     it('should append word probability lists correctly', () => {
//       const { result } = renderHook(() => useChatReducer());
//       expect(result.current[0].messages).toEqual([]);
//       act(() => {
//         result.current[1]({
//           type: 'CREATE_NEW_USER_MESSAGE',
//           inputString: 'This is user message',
//         });
//       });
//
//       expect(result.current[0].messages).toEqual([
//         {
//           content: 'This is user message',
//           source: MessageSource.USER,
//         },
//       ]);
//
//       const newWordProbList: WordProbList = [
//         ['Hi', 0.5],
//         ['Hello', 0.3],
//         ['Hey', 0.2],
//       ];
//
//       act(() => {
//         result.current[1]({
//           type: 'APPEND_NEW_AI_MESSAGE',
//           wordProbList: newWordProbList,
//         });
//       });
//
//       // Verify the message content is correctly appended
//       expect(result.current[0].messages).toEqual([
//         {
//           content: 'This is user message',
//           source: MessageSource.USER,
//         },
//         {
//           content: [newWordProbList],
//           source: MessageSource.AI,
//         },
//       ]);
//
//       const newWordProbList2: WordProbList = [
//         ['It', 0.5],
//         ['I', 0.3],
//         ['How', 0.2],
//       ];
//       act(() => {
//         result.current[1]({
//           type: 'APPEND_NEW_AI_MESSAGE',
//           wordProbList: newWordProbList2,
//         });
//       });
//
//       // Verify the message content is correctly appended
//       expect(result.current[0].messages).toEqual([
//         {
//           content: 'This is user message',
//           source: MessageSource.USER,
//         },
//         {
//           content: [newWordProbList, newWordProbList2],
//           source: MessageSource.AI,
//         },
//       ]);
//     });
//
//     it('should handle empty word probability lists', () => {
//       const { result } = renderHook(() => useChatReducer());
//
//       act(() => {
//         result.current[1]({
//           type: 'SEND_NEW_MESSAGE',
//           inputMessage: 'test message',
//         });
//       });
//
//       act(() => {
//         result.current[1]({
//           type: 'APPEND_NEW_AI_MESSAGE',
//           wordProbList: [],
//         });
//       });
//
//       const lastMessage =
//         result.current[0].messages[result.current[0].messages.length - 1];
//       expect(lastMessage.source).toBe(MessageSource.AI);
//       expect(lastMessage.content).toEqual([[]]);
//     });
//   });
//
//   describe('UPDATE_WORD_PROB_LIST_AT action', () => {
//     it('should update specific word probability list in a message', () => {
//       const { result } = renderHook(() => useChatReducer());
//
//       act(() => {
//         result.current[1]({
//           type: 'CREATE_NEW_USER_MESSAGE',
//           inputString: 'test message',
//         });
//       });
//       const newWordProbList: WordProbList = [
//         ['Hi', 0.5],
//         ['Hello', 0.3],
//         ['Hey', 0.2],
//       ];
//       act(() => {
//         result.current[1]({
//           type: 'APPEND_NEW_AI_MESSAGE',
//           wordProbList: newWordProbList,
//         });
//       });
//       act(() => {
//         result.current[1]({
//           type: 'APPEND_NEW_AI_MESSAGE',
//           wordProbList: newWordProbList,
//         });
//       });
//
//       // Update the second word prob list
//       const updatedWordProbList: WordProbList = [
//         ['universe', 0.7],
//         ['planet', 0.3],
//       ];
//
//       act(() => {
//         result.current[1]({
//           type: 'UPDATE_WORD_PROB_LIST_AT',
//           i: 1, // first message
//           j: 1, // second word prob list
//           wordProbList: updatedWordProbList,
//         });
//       });
//
//       const message = result.current[0].messages[1];
//       expect(message.source).toBe(MessageSource.AI);
//       expect((message.content as WordProbList[])[1]).toEqual([
//         ['Hi', 0.5], // Original first word is preserved
//         ['universe', 0.7],
//         ['planet', 0.3],
//       ]);
//     });
//   });
//   describe('EDIT_MESSAGE_AT action', () => {
//     it('should edit user message', () => {
//       const { result } = renderHook(() => useChatReducer());
//       act(() => {
//         result.current[1]({
//           type: 'CREATE_NEW_USER_MESSAGE',
//           inputString: 'test message',
//         });
//       });
//       act(() => {
//         result.current[1]({
//           type: 'EDIT_MESSAGE_AT',
//           i: 0,
//           j: 0,
//           message: {
//             content: 'New test message',
//             source: MessageSource.USER,
//           },
//         });
//       });
//       expect(result.current[0].messages[0].content).toEqual('New test message');
//     });
//     it('should edit user message', () => {
//       const { result } = renderHook(() => useChatReducer());
//       act(() => {
//         result.current[1]({
//           type: 'CREATE_NEW_USER_MESSAGE',
//           inputString: 'test message',
//         });
//       });
//       const newWordProbList: WordProbList = [
//         ['Hi', 0.5],
//         ['Hello', 0.3],
//         ['Hey', 0.2],
//       ];
//       act(() => {
//         result.current[1]({
//           type: 'APPEND_NEW_AI_MESSAGE',
//           wordProbList: newWordProbList,
//         });
//       });
//       act(() => {
//         result.current[1]({
//           type: 'APPEND_NEW_AI_MESSAGE',
//           wordProbList: newWordProbList,
//         });
//       });
//       const updatedWordProbList: WordProbList = [
//         ['universe', 0.7],
//         ['planet', 0.3],
//       ];
//       act(() => {
//         result.current[1]({
//           type: 'EDIT_MESSAGE_AT',
//           i: 1,
//           j: 0,
//           message: {
//             content: [updatedWordProbList],
//             source: MessageSource.AI,
//           },
//         });
//       });
//       expect(result.current[0].messages[1].content).toEqual([
//         updatedWordProbList,
//       ]);
//     });
//   });
// });
