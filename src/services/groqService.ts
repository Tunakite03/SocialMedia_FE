import Groq from 'groq-sdk';

export interface GroqChatMessage {
   role: 'system' | 'user' | 'assistant';
   content: string;
}

export interface GroqChatConfig {
   model?: string;
   temperature?: number;
   max_tokens?: number;
   stream?: boolean;
}

class GroqService {
   private client: Groq | null = null;
   private conversationHistory: GroqChatMessage[] = [];
   private defaultConfig: GroqChatConfig = {
      model: 'llama-3.3-70b-versatile', // hoặc các model khác: mixtral-8x7b-32768, llama2-70b-4096
      temperature: 0.7,
      max_tokens: 1024,
      stream: false,
   };

   /**
    * Initialize Groq client with API key
    */
   initialize(apiKey: string) {
      if (!apiKey) {
         throw new Error('Groq API key is required');
      }

      this.client = new Groq({
         apiKey: apiKey,
         dangerouslyAllowBrowser: true, // Chỉ dùng cho development, production nên proxy qua backend
      });

      // Set system message
      this.conversationHistory = [
         {
            role: 'system',
            content:
               'Bạn là Otakumi Kunn, một trợ lý AI thân thiện và hữu ích. Bạn nói tiếng Việt một cách tự nhiên và có khả năng hiểu và phản hồi các cảm xúc của người dùng. Hãy luôn lịch sự, đồng cảm và cung cấp lời khuyên hữu ích.',
         },
      ];
   }

   /**
    * Check if service is initialized
    */
   isInitialized(): boolean {
      return this.client !== null;
   }

   /**
    * Send message to Groq API and get response
    */
   async sendMessage(message: string, config?: GroqChatConfig): Promise<string> {
      if (!this.client) {
         throw new Error('Groq service is not initialized. Call initialize() first with your API key.');
      }

      // Add user message to history
      this.conversationHistory.push({
         role: 'user',
         content: message,
      });

      try {
         const completion = await this.client.chat.completions.create({
            messages: this.conversationHistory,
            model: config?.model || this.defaultConfig.model!,
            temperature: config?.temperature ?? this.defaultConfig.temperature,
            max_tokens: config?.max_tokens || this.defaultConfig.max_tokens,
         });

         const assistantResponse =
            completion.choices[0]?.message?.content || 'Xin lỗi, tôi không thể phản hồi lúc này.';

         // Add assistant response to history
         this.conversationHistory.push({
            role: 'assistant',
            content: assistantResponse,
         });

         return assistantResponse;
      } catch (error) {
         console.error('Groq API Error:', error);

         // Remove the user message that caused error
         this.conversationHistory.pop();

         if (error instanceof Error) {
            if (error.message.includes('API key')) {
               throw new Error('API key không hợp lệ. Vui lòng kiểm tra lại.');
            }
            throw new Error(`Lỗi khi gọi Groq API: ${error.message}`);
         }

         throw new Error('Đã có lỗi xảy ra khi xử lý tin nhắn. Vui lòng thử lại.');
      }
   }

   /**
    * Stream message response (for real-time typing effect)
    */
   async *streamMessage(message: string, config?: GroqChatConfig): AsyncGenerator<string> {
      if (!this.client) {
         throw new Error('Groq service is not initialized. Call initialize() first with your API key.');
      }

      // Add user message to history
      this.conversationHistory.push({
         role: 'user',
         content: message,
      });

      try {
         const stream = await this.client.chat.completions.create({
            messages: this.conversationHistory,
            model: config?.model || this.defaultConfig.model!,
            temperature: config?.temperature ?? this.defaultConfig.temperature,
            max_tokens: config?.max_tokens || this.defaultConfig.max_tokens,
            stream: true,
         });

         let fullResponse = '';

         for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            fullResponse += content;
            yield content;
         }

         // Add complete assistant response to history
         this.conversationHistory.push({
            role: 'assistant',
            content: fullResponse,
         });
      } catch (error) {
         // Remove the user message that caused error
         this.conversationHistory.pop();

         console.error('Groq Stream Error:', error);
         throw new Error('Lỗi khi stream tin nhắn từ Groq API');
      }
   }

   /**
    * Get conversation history
    */
   getHistory(): GroqChatMessage[] {
      return this.conversationHistory;
   }

   /**
    * Clear conversation history (keeping system message)
    */
   clearHistory() {
      const systemMessage = this.conversationHistory[0];
      this.conversationHistory = systemMessage ? [systemMessage] : [];
   }

   /**
    * Update system message
    */
   setSystemMessage(message: string) {
      if (this.conversationHistory.length > 0 && this.conversationHistory[0].role === 'system') {
         this.conversationHistory[0].content = message;
      } else {
         this.conversationHistory.unshift({
            role: 'system',
            content: message,
         });
      }
   }

   /**
    * Get available models
    */
   getAvailableModels(): string[] {
      return [
         'llama-3.3-70b-versatile',
         'llama-3.1-70b-versatile',
         'llama-3.1-8b-instant',
         'mixtral-8x7b-32768',
         'gemma2-9b-it',
      ];
   }

   /**
    * Update config
    */
   updateConfig(config: Partial<GroqChatConfig>) {
      this.defaultConfig = {
         ...this.defaultConfig,
         ...config,
      };
   }

   /**
    * Get current config
    */
   getConfig(): GroqChatConfig {
      return { ...this.defaultConfig };
   }
}

export const groqService = new GroqService();
export default groqService;
