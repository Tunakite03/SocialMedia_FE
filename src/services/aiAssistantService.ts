import type { AIEmotionAnalysis, AIEmotionType, AIMessage } from '@/types';

// Emotion keywords mapping
const emotionKeywords: Record<AIEmotionType, string[]> = {
   happy: ['vui', 'hạnh phúc', 'tuyệt vời', 'yêu', 'thích', 'tốt', 'hay', 'thành công', 'haha', '😊', '😄', '🎉'],
   sad: ['buồn', 'tệ', 'tồi tệ', 'khó chịu', 'chán', 'thất vọng', 'mệt mỏi', '😢', '😭', '💔'],
   angry: ['tức', 'giận', 'bực', 'phẫn nộ', 'ghét', 'điên', '😡', '😤', '💢'],
   anxious: ['lo lắng', 'căng thẳng', 'áp lực', 'sợ', 'hãi', 'bất an', 'lo', '😰', '😨'],
   excited: ['hào hứng', 'phấn khích', 'háo hức', 'không thể chờ', 'tuyệt', '🤩', '✨', '🔥'],
   neutral: ['bình thường', 'ổn', 'được', 'okay', 'ok'],
   confused: ['không hiểu', 'bối rối', 'rối', 'lúng túng', 'hmm', '🤔', '😕'],
   stressed: ['stress', 'mệt', 'quá tải', 'kiệt sức', 'áp lực', 'đè nén', '😫', '😩'],
};

// Response templates based on emotions
const responseTemplates: Record<AIEmotionType, string[]> = {
   happy: [
      'Thật tuyệt vời khi bạn đang cảm thấy vui vẻ! 😊 Hãy tiếp tục lan tỏa năng lượng tích cực này nhé!',
      'Tôi rất vui khi thấy bạn hạnh phúc! Những cảm xúc tích cực như vậy rất có lợi cho sức khỏe tinh thần đấy.',
      'Tuyệt vời! Hãy lưu giữ những khoảnh khắc hạnh phúc này và chia sẻ với những người xung quanh bạn nhé!',
   ],
   sad: [
      'Tôi hiểu bạn đang cảm thấy buồn. Hãy nhớ rằng cảm xúc này là tạm thời và mọi thứ sẽ tốt hơn thôi. 💙',
      'Đôi khi buồn là điều bình thường. Hãy cho phép bản thân cảm nhận và đừng ngại tìm đến những người thân yêu để chia sẻ nhé.',
      'Tôi ở đây lắng nghe bạn. Nếu cần, hãy thử nghỉ ngơi, nghe nhạc yêu thích hoặc làm điều gì đó bạn thích.',
   ],
   angry: [
      'Tôi nhận thấy bạn đang tức giận. Hãy thử hít thở sâu vài lần để bình tĩnh lại nhé. 🌬️',
      'Cảm xúc giận dữ là bình thường. Hãy tìm cách giải tỏa lành mạnh như tập thể dục hoặc viết ra những gì bạn đang cảm thấy.',
      'Trước khi phản ứng, hãy dành vài phút để suy nghĩ. Đôi khi một cái đầu lạnh giúp ta xử lý tốt hơn.',
   ],
   anxious: [
      'Tôi cảm nhận được sự lo lắng của bạn. Hãy thử kỹ thuật hít thở 4-7-8: hít vào 4 giây, giữ 7 giây, thở ra 8 giây. 🧘',
      'Lo lắng có thể khiến mọi thứ trở nên tồi tệ hơn thực tế. Hãy tập trung vào những gì bạn có thể kiểm soát.',
      'Hãy chia nhỏ vấn đề ra và xử lý từng bước một. Bạn mạnh mẽ hơn bạn nghĩ đấy!',
   ],
   excited: [
      'Năng lượng phấn khích của bạn thật tuyệt vời! 🎉 Hãy tận dụng động lực này để làm những điều ý nghĩa nhé!',
      'Tôi thích sự nhiệt huyết của bạn! Hãy giữ vững ngọn lửa đam mê này.',
      'Thật tuyệt khi bạn đang háo hức! Đừng quên cân bằng với nghỉ ngơi để duy trì năng lượng dài lâu nhé!',
   ],
   neutral: [
      'Cảm giác bình thường cũng tốt mà. Đôi khi sự ổn định là điều quý giá nhất. 😌',
      'Không phải lúc nào cũng phải có cảm xúc mạnh. Sự bình yên cũng là một loại hạnh phúc đấy.',
      'Tôi đây nếu bạn muốn trò chuyện về bất cứ điều gì!',
   ],
   confused: [
      'Bạn đang cảm thấy bối rối à? Hãy thử phân tích vấn đề từng phần một, có thể sẽ rõ ràng hơn đấy! 🤔',
      'Không sao cả, nhiều khi bối rối là bước đầu của việc học hỏi. Hãy đặt câu hỏi và tìm hiểu thêm.',
      'Nếu bạn đang lúng túng về điều gì đó, hãy kể cho tôi nghe. Có thể tôi giúp được bạn sáng tỏ hơn!',
   ],
   stressed: [
      'Tôi thấy bạn đang stress. Hãy tạm dừng và nghỉ ngơi một chút nhé. 🌿 Sức khỏe quan trọng hơn mọi thứ.',
      'Khi căng thẳng, cơ thể cần được nghỉ ngơi. Hãy thử đi dạo, nghe nhạc hoặc làm điều gì đó thư giãn.',
      'Stress kéo dài không tốt cho sức khỏe. Hãy sắp xếp ưu tiên và biết từ chối khi cần thiết nhé!',
   ],
};

class AIAssistantService {
   private messages: AIMessage[] = [];

   /**
    * Analyze emotion from user message
    */
   analyzeEmotion(message: string): AIEmotionAnalysis {
      const lowerMessage = message.toLowerCase();
      const emotions: Record<AIEmotionType, number> = {
         happy: 0,
         sad: 0,
         angry: 0,
         anxious: 0,
         excited: 0,
         neutral: 0,
         confused: 0,
         stressed: 0,
      };

      // Count keyword matches
      let totalMatches = 0;
      Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
         const matches = keywords.filter((keyword) => lowerMessage.includes(keyword.toLowerCase())).length;
         emotions[emotion as AIEmotionType] = matches;
         totalMatches += matches;
      });

      // Normalize scores
      if (totalMatches > 0) {
         Object.keys(emotions).forEach((emotion) => {
            emotions[emotion as AIEmotionType] = emotions[emotion as AIEmotionType] / totalMatches;
         });
      } else {
         // Default to neutral if no keywords found
         emotions.neutral = 1;
      }

      // Find primary emotion
      let primary: AIEmotionType = 'neutral';
      let maxScore = 0;
      Object.entries(emotions).forEach(([emotion, score]) => {
         if (score > maxScore) {
            maxScore = score;
            primary = emotion as AIEmotionType;
         }
      });

      const confidence = maxScore;

      // Generate suggestions based on emotion
      const suggestions = this.generateSuggestions(primary);

      return {
         primary,
         confidence,
         emotions,
         suggestions,
      };
   }

   /**
    * Generate suggestions based on detected emotion
    */
   private generateSuggestions(emotion: AIEmotionType): string[] {
      const suggestionMap: Record<AIEmotionType, string[]> = {
         happy: ['Chia sẻ niềm vui với bạn bè', 'Viết nhật ký về khoảnh khắc này', 'Lan tỏa năng lượng tích cực'],
         sad: ['Nói chuyện với người thân', 'Nghe nhạc thư giãn', 'Viết ra cảm xúc của bạn'],
         angry: ['Thực hành hít thở sâu', 'Tập thể dục để giải tỏa', 'Tạm dừng trước khi phản ứng'],
         anxious: [
            'Thực hành thiền hoặc yoga',
            'Liệt kê những gì bạn có thể kiểm soát',
            'Nói chuyện với ai đó bạn tin tưởng',
         ],
         excited: [
            'Kế hoạch hóa hành động tiếp theo',
            'Chia sẻ sự phấn khích với người khác',
            'Ghi lại ý tưởng của bạn',
         ],
         neutral: ['Dành thời gian cho sở thích', 'Kết nối với bạn bè', 'Thử thứ gì đó mới'],
         confused: ['Chia nhỏ vấn đề thành phần nhỏ hơn', 'Tìm kiếm thông tin thêm', 'Hỏi ý kiến người khác'],
         stressed: ['Nghỉ ngơi và thư giãn', 'Sắp xếp ưu tiên công việc', 'Học cách từ chối khi cần'],
      };

      return suggestionMap[emotion] || [];
   }

   /**
    * Generate AI response based on user message and emotion
    */
   generateResponse(userMessage: string, emotion: AIEmotionAnalysis): string {
      const templates = responseTemplates[emotion.primary];
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

      // Add context-aware response
      const contextResponse = this.generateContextResponse(userMessage, emotion);

      return `${randomTemplate}\n\n${contextResponse}`;
   }

   /**
    * Generate context-aware response
    */
   private generateContextResponse(message: string, emotion: AIEmotionAnalysis): string {
      const lowerMessage = message.toLowerCase();

      // Check for specific topics
      if (lowerMessage.includes('công việc') || lowerMessage.includes('làm việc')) {
         return 'Về vấn đề công việc, hãy nhớ rằng sức khỏe của bạn quan trọng hơn. Nếu cần, đừng ngại xin hỗ trợ từ đồng nghiệp.';
      }

      if (lowerMessage.includes('học') || lowerMessage.includes('thi')) {
         return 'Học tập có thể gây áp lực, nhưng hãy nhớ học đều đặn và nghỉ ngơi đủ. Bạn có thể làm được!';
      }

      if (lowerMessage.includes('gia đình') || lowerMessage.includes('bố') || lowerMessage.includes('mẹ')) {
         return 'Gia đình là nguồn hỗ trợ quan trọng. Hãy dành thời gian giao tiếp và thấu hiểu lẫn nhau.';
      }

      if (lowerMessage.includes('bạn bè') || lowerMessage.includes('người yêu')) {
         return 'Các mối quan hệ cần được nuôi dưỡng. Hãy thành thật và lắng nghe nhau.';
      }

      if (lowerMessage.includes('sức khỏe') || lowerMessage.includes('bệnh')) {
         return 'Sức khỏe là tài sản quý giá nhất. Nếu có vấn đề sức khỏe nghiêm trọng, hãy tìm đến chuyên gia y tế nhé.';
      }

      // Default general response
      if (emotion.confidence > 0.7) {
         return `Tôi nhận thấy bạn đang ${this.getEmotionText(
            emotion.primary
         )}. Hãy luôn nhớ rằng mọi cảm xúc đều có giá trị và là một phần của cuộc sống.`;
      }

      return 'Bạn có muốn chia sẻ thêm không? Tôi luôn sẵn sàng lắng nghe! 💭';
   }

   /**
    * Get emotion text in Vietnamese
    */
   private getEmotionText(emotion: AIEmotionType): string {
      const emotionTexts: Record<AIEmotionType, string> = {
         happy: 'vui vẻ và hạnh phúc',
         sad: 'buồn',
         angry: 'tức giận',
         anxious: 'lo lắng',
         excited: 'phấn khích',
         neutral: 'bình thường',
         confused: 'bối rối',
         stressed: 'căng thẳng và stress',
      };
      return emotionTexts[emotion];
   }

   /**
    * Add message to history
    */
   addMessage(message: AIMessage): void {
      this.messages.push(message);
      // Keep only last 50 messages
      if (this.messages.length > 50) {
         this.messages = this.messages.slice(-50);
      }
   }

   /**
    * Get message history
    */
   getMessages(): AIMessage[] {
      return this.messages;
   }

   /**
    * Clear message history
    */
   clearMessages(): void {
      this.messages = [];
   }

   /**
    * Get greeting message
    */
   getGreeting(): string {
      const greetings = [
         'Xin chào! Tôi là trợ lý AI của bạn. Hãy chia sẻ cảm xúc và tôi sẽ giúp phân tích nhé! 😊',
         'Chào bạn! Tôi ở đây để lắng nghe và hỗ trợ bạn. Bạn đang cảm thấy thế nào?',
         'Hi! Tôi có thể giúp bạn hiểu rõ hơn về cảm xúc của mình. Hãy kể cho tôi nghe nhé!',
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
   }
}

export const aiAssistantService = new AIAssistantService();
export default aiAssistantService;
