import { api } from './client';

export const chatbotApi = {
  chat: (message, history = []) => 
    api.post('/chat', { message, history }),
};
