/**
 * Sentiment Analysis Queue Manager
 * Batch process và cache sentiment analysis requests để giảm API calls
 */

import { sentimentService, type SentimentResult } from './sentimentService';

interface SentimentCacheEntry {
   text: string;
   result: SentimentResult;
   timestamp: number;
}

class SentimentAnalysisQueue {
   private queue: Set<string> = new Set();
   private cache: Map<string, SentimentCacheEntry> = new Map();
   private processing: boolean = false;
   private batchTimeout: number | null = null;
   private readonly BATCH_DELAY = 200; // 200ms - faster response time
   private readonly BATCH_SIZE = 10; // Max 10 items per batch for better throughput
   private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes - longer cache
   private callbacks: Map<string, ((result: SentimentResult | null) => void)[]> = new Map();

   /**
    * Generate cache key from text
    */
   private getCacheKey(text: string): string {
      // Normalize text: lowercase, trim, remove extra spaces
      return text.toLowerCase().trim().replace(/\s+/g, ' ');
   }

   /**
    * Check if result is in cache and still valid
    */
   private getFromCache(text: string): SentimentResult | null {
      const key = this.getCacheKey(text);
      const entry = this.cache.get(key);

      if (!entry) return null;

      // Check if cache is still valid
      const now = Date.now();
      if (now - entry.timestamp > this.CACHE_TTL) {
         this.cache.delete(key);
         return null;
      }

      return entry.result;
   }

   /**
    * Save result to cache
    */
   private saveToCache(text: string, result: SentimentResult): void {
      const key = this.getCacheKey(text);
      this.cache.set(key, {
         text: key,
         result,
         timestamp: Date.now(),
      });
   }

   /**
    * Add text to queue for analysis
    */
   async analyze(text: string): Promise<SentimentResult | null> {
      // Skip if text is too short (increased threshold to reduce unnecessary API calls)
      if (text.trim().length < 5) {
         return null;
      }

      // Check cache first
      const cached = this.getFromCache(text);
      if (cached) {
         console.log('[SentimentQueue] Cache hit:', text.substring(0, 30));
         return cached;
      }

      const key = this.getCacheKey(text);

      // Return promise that will be resolved when batch processes
      return new Promise((resolve) => {
         // Add to queue
         this.queue.add(key);

         // Store callback
         if (!this.callbacks.has(key)) {
            this.callbacks.set(key, []);
         }
         this.callbacks.get(key)!.push(resolve);

         // Store original text (for API call)
         this.cache.set(key, {
            text,
            result: null as any, // Temporary placeholder
            timestamp: Date.now(),
         });

         // Schedule batch processing
         this.scheduleBatch();
      });
   }

   /**
    * Schedule batch processing with debounce
    */
   private scheduleBatch(): void {
      // Clear existing timeout
      if (this.batchTimeout) {
         clearTimeout(this.batchTimeout);
      }

      // Schedule new batch
      this.batchTimeout = window.setTimeout(() => {
         this.processBatch();
      }, this.BATCH_DELAY);
   }

   /**
    * Process batch of queued items
    */
   private async processBatch(): Promise<void> {
      if (this.processing || this.queue.size === 0) return;

      this.processing = true;

      try {
         // Get batch items
         const batch = Array.from(this.queue).slice(0, this.BATCH_SIZE);
         const texts = batch.map((key) => this.cache.get(key)?.text || key);

         console.log(
            `[SentimentQueue] Processing batch of ${batch.length} items:`,
            texts.map((t) => t.substring(0, 30) + '...'),
         );

         // Call API once for all items
         const startTime = Date.now();
         const results = await sentimentService.analyzeTranscript(texts);
         const processingTime = Date.now() - startTime;

         console.log(`[SentimentQueue] Batch completed in ${processingTime}ms, got ${results.length} results`);
         console.log(`[SentimentQueue] Full results:`, results);

         // Process results
         batch.forEach((key, index) => {
            const result = results[index];
            const originalText = this.cache.get(key)?.text || key;

            // Debug log
            console.log(`[SentimentQueue] Processing result ${index + 1}:`, result);

            // Save to cache
            if (result) {
               this.saveToCache(originalText, result);
               console.log(
                  `[SentimentQueue] Result ${index + 1}: ${result.sentiment} (${(result.confidence * 100).toFixed(1)}%)`,
               );
            } else {
               console.warn(`[SentimentQueue] Result ${index + 1} is null/undefined`);
            }

            // Resolve callbacks
            const callbacks = this.callbacks.get(key) || [];
            callbacks.forEach((callback) => callback(result || null));

            // Cleanup
            this.queue.delete(key);
            this.callbacks.delete(key);
         });

         // If there are more items, process next batch immediately
         if (this.queue.size > 0) {
            console.log(`[SentimentQueue] ${this.queue.size} items remaining, processing next batch...`);
            setTimeout(() => this.processBatch(), 50); // Reduced from 100ms to 50ms
         }
      } catch (error) {
         console.error('[SentimentQueue] Batch processing error:', error);

         // Resolve all callbacks with null
         this.queue.forEach((key) => {
            const callbacks = this.callbacks.get(key) || [];
            callbacks.forEach((callback) => callback(null));
            this.callbacks.delete(key);
         });

         this.queue.clear();
      } finally {
         this.processing = false;
      }
   }

   /**
    * Clear cache (optional, for testing)
    */
   clearCache(): void {
      this.cache.clear();
   }

   /**
    * Get cache stats (for debugging)
    */
   getStats() {
      return {
         cacheSize: this.cache.size,
         queueSize: this.queue.size,
         processing: this.processing,
      };
   }
}

// Singleton instance
export const sentimentQueue = new SentimentAnalysisQueue();
