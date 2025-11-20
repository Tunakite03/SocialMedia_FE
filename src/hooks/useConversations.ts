import { messageService } from '@/services/messageService';
import { useChatStore } from '@/store';
import type { Conversation } from '@/types';
import { useCallback } from 'react';

export const useConversations = () => {
   const { conversations, setConversations, addConversation, isLoading, setIsLoading } = useChatStore();

   const loadConversations = useCallback(async () => {
      setIsLoading(true);
      try {
         const response = await messageService.getConversations();
         if (response.success && response.data) {
            setConversations(response.data.conversations);
         }
      } catch (error) {
         console.error('Failed to load conversations:', error);
      } finally {
         setIsLoading(false);
      }
   }, [setConversations, setIsLoading]);

   const createDirectConversation = useCallback(
      async (userId: string): Promise<Conversation | null> => {
         try {
            const response = await messageService.getOrCreateDirectConversation(userId);
            if (response.success && response.data) {
               addConversation(response.data.conversation);
               return response.data.conversation;
            }
         } catch (error) {
            console.error('Failed to create conversation:', error);
         }
         return null;
      },
      [addConversation]
   );

   const createGroupConversation = useCallback(
      async (title: string, participantIds: string[]): Promise<Conversation | null> => {
         try {
            const response = await messageService.createGroupConversation({
               title,
               participantIds,
            });
            if (response.success && response.data) {
               addConversation(response.data.conversation);
               return response.data.conversation;
            }
         } catch (error) {
            console.error('Failed to create group conversation:', error);
         }
         return null;
      },
      [addConversation]
   );

   const sendDirectMessage = useCallback(async (receiverId: string, content: string) => {
      try {
         const response = await messageService.sendDirectMessage(receiverId, content);
         return response;
      } catch (error) {
         console.error('Failed to send direct message:', error);
         return null;
      }
   }, []);

   return {
      conversations,
      isLoading,
      loadConversations,
      createDirectConversation,
      createGroupConversation,
      sendDirectMessage,
   };
};
