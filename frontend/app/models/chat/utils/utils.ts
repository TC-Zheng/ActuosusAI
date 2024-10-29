import { Message } from '@/app/models/hooks/chatReducer';

const messagesUpTo = (messages: Message[], i: number, j: number) => {
  const m = messages.slice(0, i + 1);
  m[i] = { ...m[i], content: m[i].content.slice(0, j + 1) };
  return m;
};
