/**
 * Sentiment Analysis Service
 * Tích hợp API phân tích cảm xúc cho transcript cuộc gọi
 */

import { apiService } from './apiService';
import type { ApiResponse } from '@/types';

export interface SentimentScore {
   POSITIVE: number;
   NEUTRAL: number;
   NEGATIVE: number;
}

export interface EmotionScore {
   ENJOYMENT: number;
   SURPRISE: number;
   FEAR: number;
   SADNESS: number;
   ANGER: number;
   DISGUST: number;
   OTHER: number;
}

export interface SentimentResult {
   sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
   confidence: number;
   scores: SentimentScore;
   emotionScores?: EmotionScore; // Add emotion scores for detailed display
   processingTime?: number;
}

export interface BatchSentimentRequest {
   texts: string[];
}

export interface BatchSentimentResponse {
   results: SentimentResult[];
   totalAnalyzed: number;
}

export interface SingleSentimentRequest {
   text: string;
}

class SentimentService {
   private readonly endpoint = '/sentiment';

   /**
    * Phân tích cảm xúc cho một đoạn văn bản
    */
   async analyzeSingle(text: string): Promise<ApiResponse<SentimentResult>> {
      try {
         const response = await apiService.post<SentimentResult>(`${this.endpoint}/analyze`, {
            text,
         });
         return response;
      } catch (error) {
         console.error('Error analyzing sentiment:', error);
         throw error;
      }
   }

   /**
    * Phân tích cảm xúc cho nhiều đoạn văn bản (batch)
    * Tối ưu cho việc phân tích transcript cuộc gọi
    */
   async analyzeBatch(texts: string[]): Promise<ApiResponse<BatchSentimentResponse>> {
      try {
         if (texts.length === 0) {
            throw new Error('texts array cannot be empty');
         }

         if (texts.length > 100) {
            console.warn('texts array exceeds 100 items, truncating...');
            texts = texts.slice(0, 100);
         }

         const response = await apiService.post<BatchSentimentResponse>(`${this.endpoint}/analyze/batch`, {
            texts,
         });
         return response;
      } catch (error) {
         console.error('Error analyzing batch sentiment:', error);
         throw error;
      }
   }

   /**
    * Phân tích cảm xúc cho transcript theo chunks
    * Tự động chia nhỏ nếu vượt quá giới hạn
    */
   async analyzeTranscript(transcriptTexts: string[]): Promise<SentimentResult[]> {
      const chunkSize = 100;
      const results: SentimentResult[] = [];

      for (let i = 0; i < transcriptTexts.length; i += chunkSize) {
         const chunk = transcriptTexts.slice(i, i + chunkSize);
         try {
            console.log(`[SentimentService] Analyzing chunk with ${chunk.length} items`);
            const response = await this.analyzeBatch(chunk);
            console.log(`[SentimentService] API Response:`, response);

            if (response.success && response.data) {
               console.log(`[SentimentService] Response data:`, response.data);
               console.log(`[SentimentService] Results:`, response.data.results);

               // Handle both array and single object response
               const resultsArray = Array.isArray(response.data.results) 
                  ? response.data.results 
                  : [response.data.results];
               
               console.log(`[SentimentService] Results array (normalized):`, resultsArray);

               // Process và normalize kết quả
               const normalizedResults = resultsArray.map((result: any, index: number) => {
                  console.log(`[SentimentService] Raw result ${index + 1}:`, result);

                  // Xử lý response có thể có nhiều format khác nhau
                  let sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
                  let confidence = 0;
                  let scores: SentimentScore = { POSITIVE: 0, NEUTRAL: 1, NEGATIVE: 0 };

                  // Helper: map 7 emotion classes -> POS/NEU/NEG
                  const mapEmotionToThreeClass = (emotion: string): 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' => {
                     const e = emotion.toUpperCase();
                     if (['ENJOYMENT', 'SURPRISE'].includes(e)) return 'POSITIVE';
                     if (['FEAR', 'SADNESS', 'ANGER', 'DISGUST'].includes(e)) return 'NEGATIVE';
                     return 'NEUTRAL';
                  };

                  // Helper: aggregate 7-way scores -> 3-way
                  const aggregateEmotionScores = (rawScores: Record<string, number>): { 
                     sentiment: SentimentScore; 
                     emotion: EmotionScore 
                  } => {
                     console.log('[SentimentService] Raw scores from API:', rawScores);
                     
                     const upperKeys = Object.keys(rawScores).reduce<Record<string, number>>((acc, key) => {
                        acc[key.toUpperCase()] = rawScores[key];
                        return acc;
                     }, {});

                     const enjoyment = upperKeys.ENJOYMENT || 0;
                     const surprise = upperKeys.SURPRISE || 0;
                     const fear = upperKeys.FEAR || 0;
                     const sadness = upperKeys.SADNESS || 0;
                     const anger = upperKeys.ANGER || 0;
                     const disgust = upperKeys.DISGUST || 0;
                     const other = upperKeys.OTHER || 0;

                     const positive = enjoyment + surprise;
                     const negative = fear + sadness + anger + disgust;
                     const neutral = other;

                     const total = positive + negative + neutral || 1; // tránh chia cho 0

                     const result = {
                        sentiment: {
                           POSITIVE: positive / total,
                           NEUTRAL: neutral / total,
                           NEGATIVE: negative / total,
                        },
                        emotion: {
                           ENJOYMENT: enjoyment,
                           SURPRISE: surprise,
                           FEAR: fear,
                           SADNESS: sadness,
                           ANGER: anger,
                           DISGUST: disgust,
                           OTHER: other,
                        }
                     };
                     
                     console.log('[SentimentService] Aggregated emotion scores:', result.emotion);
                     return result;
                  };

                  // Store emotion scores separately
                  let emotionScores: EmotionScore | undefined;

                  // Kiểm tra các field có thể có
                  if (result) {
                     // Có thể API trả về 'emotion' hoặc 'label' thay vì 'sentiment'
                     const sentimentValue = result.sentiment || result.emotion || result.label || result.prediction;

                     if (sentimentValue) {
                        // Normalize sentiment value (có thể là lowercase hoặc có format khác)
                        const normalizedSentiment = sentimentValue.toString().toUpperCase();

                        if (['POSITIVE', 'NEUTRAL', 'NEGATIVE'].includes(normalizedSentiment)) {
                           sentiment = normalizedSentiment as 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
                        } else {
                           // Trường hợp API trả về emotion 7 lớp (ENJOYMENT, SADNESS, ...)
                           sentiment = mapEmotionToThreeClass(normalizedSentiment);
                        }
                     }

                     // Confidence có thể có nhiều tên khác nhau
                     confidence = result.confidence || result.score || result.probability || 0;

                     // Scores có thể có format khác
                     const rawScores = result.scores || result.probabilities;

                     if (rawScores) {
                        const keys = Object.keys(rawScores).map((k) => k.toUpperCase());
                        const hasEmotionKeys =
                           ['ENJOYMENT', 'SURPRISE', 'FEAR', 'SADNESS', 'ANGER', 'DISGUST', 'OTHER'].some((k) =>
                              keys.includes(k),
                           );

                        if (hasEmotionKeys) {
                           const aggregated = aggregateEmotionScores(rawScores);
                           scores = aggregated.sentiment;
                           emotionScores = aggregated.emotion;
                        } else {
                           // Giả sử backend đã trả về POSITIVE/NEUTRAL/NEGATIVE
                           scores = {
                              POSITIVE: rawScores.POSITIVE ?? 0,
                              NEUTRAL: rawScores.NEUTRAL ?? 0,
                              NEGATIVE: rawScores.NEGATIVE ?? 0,
                           };
                        }
                     }
                  }

                  const normalizedResult: SentimentResult = {
                     sentiment,
                     confidence,
                     scores,
                     emotionScores,
                     processingTime: result.processingTime,
                  };

                  console.log(`[SentimentService] Normalized result ${index + 1}:`, normalizedResult);
                  return normalizedResult;
               });

               results.push(...normalizedResults);
            } else {
               console.warn(`[SentimentService] API call unsuccessful or no data:`, response);
               // Tạo default results cho chunk bị lỗi
               results.push(
                  ...chunk.map(() => ({
                     sentiment: 'NEUTRAL' as const,
                     confidence: 0,
                     scores: { POSITIVE: 0, NEUTRAL: 1, NEGATIVE: 0 },
                  })),
               );
            }
         } catch (error) {
            console.error(`Error analyzing chunk ${i / chunkSize + 1}:`, error);
            // Tạo default results cho chunk bị lỗi
            results.push(
               ...chunk.map(() => ({
                  sentiment: 'NEUTRAL' as const,
                  confidence: 0,
                  scores: { POSITIVE: 0, NEUTRAL: 1, NEGATIVE: 0 },
               })),
            );
         }
      }

      console.log(`[SentimentService] Final results before return:`, results);
      return results;
   }

   /**
    * Phân tích cảm xúc tổng hợp cho toàn bộ cuộc gọi
    */
   async analyzeCallOverall(transcriptTexts: string[]): Promise<{
      overallSentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
      averageConfidence: number;
      sentimentDistribution: SentimentScore | EmotionScore;
      totalAnalyzed: number;
   }> {
      const results = await this.analyzeTranscript(transcriptTexts);

      if (results.length === 0) {
         return {
            overallSentiment: 'NEUTRAL',
            averageConfidence: 0,
            sentimentDistribution: { POSITIVE: 0, NEUTRAL: 1, NEGATIVE: 0 },
            totalAnalyzed: 0,
         };
      }

      // Tính toán sentiment tổng hợp
      const sentimentCounts = {
         POSITIVE: 0,
         NEUTRAL: 0,
         NEGATIVE: 0,
      };

      let totalConfidence = 0;
      const totalScores = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 };
      const totalEmotionScores = {
         ENJOYMENT: 0,
         SURPRISE: 0,
         FEAR: 0,
         SADNESS: 0,
         ANGER: 0,
         DISGUST: 0,
         OTHER: 0,
      };

      let hasEmotionScores = false;

      results.forEach((result, index) => {
         console.log(`[SentimentService] Processing result ${index + 1}:`, {
            sentiment: result.sentiment,
            confidence: result.confidence,
            hasEmotionScores: !!result.emotionScores,
            emotionScores: result.emotionScores
         });
         
         sentimentCounts[result.sentiment]++;
         totalConfidence += result.confidence;
         totalScores.POSITIVE += result.scores.POSITIVE;
         totalScores.NEUTRAL += result.scores.NEUTRAL;
         totalScores.NEGATIVE += result.scores.NEGATIVE;

         // Aggregate emotion scores if available
         if (result.emotionScores) {
            hasEmotionScores = true;
            totalEmotionScores.ENJOYMENT += result.emotionScores.ENJOYMENT;
            totalEmotionScores.SURPRISE += result.emotionScores.SURPRISE;
            totalEmotionScores.FEAR += result.emotionScores.FEAR;
            totalEmotionScores.SADNESS += result.emotionScores.SADNESS;
            totalEmotionScores.ANGER += result.emotionScores.ANGER;
            totalEmotionScores.DISGUST += result.emotionScores.DISGUST;
            totalEmotionScores.OTHER += result.emotionScores.OTHER;
         }
      });
      
      console.log('[SentimentService] Total emotion scores before averaging:', totalEmotionScores);
      console.log('[SentimentService] Has emotion scores:', hasEmotionScores);

      // Sentiment chiếm đa số
      const overallSentiment = (Object.keys(sentimentCounts) as Array<'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'>).reduce(
         (a, b) => (sentimentCounts[a] > sentimentCounts[b] ? a : b),
      );

      // Confidence trung bình
      const averageConfidence = totalConfidence / results.length;

      // Phân phối sentiment - return emotion scores if available
      const sentimentDistribution = hasEmotionScores
         ? {
              ENJOYMENT: totalEmotionScores.ENJOYMENT / results.length,
              SURPRISE: totalEmotionScores.SURPRISE / results.length,
              FEAR: totalEmotionScores.FEAR / results.length,
              SADNESS: totalEmotionScores.SADNESS / results.length,
              ANGER: totalEmotionScores.ANGER / results.length,
              DISGUST: totalEmotionScores.DISGUST / results.length,
              OTHER: totalEmotionScores.OTHER / results.length,
           }
         : {
              POSITIVE: totalScores.POSITIVE / results.length,
              NEUTRAL: totalScores.NEUTRAL / results.length,
              NEGATIVE: totalScores.NEGATIVE / results.length,
           };

      console.log('[SentimentService] analyzeCallOverall - sentimentDistribution:', sentimentDistribution);

      return {
         overallSentiment,
         averageConfidence,
         sentimentDistribution,
         totalAnalyzed: results.length,
      };
   }

   /**
    * Lấy màu sắc tương ứng với sentiment (cho UI)
    */
   getSentimentColor(sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'): string {
      switch (sentiment) {
         case 'POSITIVE':
            return 'text-green-500';
         case 'NEGATIVE':
            return 'text-red-500';
         case 'NEUTRAL':
            return 'text-yellow-500';
      }
   }

   /**
    * Lấy icon/emoji tương ứng với sentiment
    */
   getSentimentEmoji(sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'): string {
      switch (sentiment) {
         case 'POSITIVE':
            return '😊';
         case 'NEGATIVE':
            return '😞';
         case 'NEUTRAL':
            return '😐';
      }
   }

   /**
    * Lấy label tiếng Việt cho sentiment
    */
   getSentimentLabel(sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'): string {
      switch (sentiment) {
         case 'POSITIVE':
            return 'Tích cực';
         case 'NEGATIVE':
            return 'Tiêu cực';
         case 'NEUTRAL':
            return 'Trung tính';
      }
   }
}

export const sentimentService = new SentimentService();
