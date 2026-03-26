import { useMutation } from '@tanstack/react-query';
import { aiService, ChatMessage } from '../services/aiService';
import { useAIStore } from '../stores/aiStore';
import { useAuthStore } from '../stores/authStore';

export function useAIChat() {
  const userId = useAuthStore((s) => s.user?.id);
  const { messages, addMessage, setTyping } = useAIStore();

  return useMutation({
    mutationFn: async (userMessage: string) => {
      const userMsg: ChatMessage = {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      };
      addMessage(userMsg);
      setTyping(true);
      const response = await aiService.chat(userMessage, userId!, messages);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
      };
      addMessage(assistantMsg);
      setTyping(false);
      return assistantMsg;
    },
    onError: () => setTyping(false),
  });
}
