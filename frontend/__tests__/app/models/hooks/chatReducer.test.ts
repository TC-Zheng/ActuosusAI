import useChatReducer, { WordStatus } from '@/app/models/hooks/chatReducer';
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
