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

export interface SentimentResult {
   sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
   confidence: number;
   scores: SentimentScore;
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
            const response = await this.analyzeBatch(chunk);
            if (response.success && response.data) {
               results.push(...response.data.results);
            }
         } catch (error) {
            console.error(`Error analyzing chunk ${i / chunkSize + 1}:`, error);
            // Tạo default results cho chunk bị lỗi
            results.push(
               ...chunk.map(() => ({
                  sentiment: 'NEUTRAL' as const,
                  confidence: 0,
                  scores: { POSITIVE: 0, NEUTRAL: 1, NEGATIVE: 0 },
               }))
            );
         }
      }

      return results;
   }

   /**
    * Phân tích cảm xúc tổng hợp cho toàn bộ cuộc gọi
    */
   async analyzeCallOverall(transcriptTexts: string[]): Promise<{
      overallSentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
      averageConfidence: number;
      sentimentDistribution: SentimentScore;
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

      results.forEach((result) => {
         sentimentCounts[result.sentiment]++;
         totalConfidence += result.confidence;
         totalScores.POSITIVE += result.scores.POSITIVE;
         totalScores.NEUTRAL += result.scores.NEUTRAL;
         totalScores.NEGATIVE += result.scores.NEGATIVE;
      });

      // Sentiment chiếm đa số
      const overallSentiment = (Object.keys(sentimentCounts) as Array<'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'>).reduce(
         (a, b) => (sentimentCounts[a] > sentimentCounts[b] ? a : b)
      );

      // Confidence trung bình
      const averageConfidence = totalConfidence / results.length;

      // Phân phối sentiment
      const sentimentDistribution = {
         POSITIVE: totalScores.POSITIVE / results.length,
         NEUTRAL: totalScores.NEUTRAL / results.length,
         NEGATIVE: totalScores.NEGATIVE / results.length,
      };

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
