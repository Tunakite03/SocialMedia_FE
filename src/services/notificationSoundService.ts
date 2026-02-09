/**
 * Service for managing notification sounds and audio feedback
 */
class NotificationSoundService {
   private audioContext: AudioContext | null = null;
   private sounds: Map<string, AudioBuffer> = new Map();
   private isEnabled = true;
   private volume = 0.3;

   // constructor() {
   //    this.loadDefaultSounds();
   // }

   /**
    * Initialize audio context (call after user interaction)
    */
   private async initAudioContext(): Promise<void> {
      if (!this.audioContext) {
         this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (this.audioContext.state === 'suspended') {
         await this.audioContext.resume();
      }
   }

   /**
    * Load default notification sounds
    */
   // private async loadDefaultSounds(): Promise<void> {
   //    const soundUrls = {
   //       notification: '/sounds/noti.mp3',
   //       like: '/sounds/like.mp3',
   //       comment: '/sounds/comment.mp3',
   //       message: '/sounds/message.mp3',
   //       call: '/sounds/call.mp3',
   //       error: '/sounds/error.mp3',
   //       success: '/sounds/success.mp3',
   //    };

   //    for (const [name, url] of Object.entries(soundUrls)) {
   //       try {
   //          await this.loadSound(name, url);
   //       } catch (error) {
   //          console.warn(`Failed to load sound ${name}:`, error);
   //       }
   //    }
   // }

   /**
    * Load a sound file into memory
    */
   // private async loadSound(name: string, url: string): Promise<void> {
   //    try {
   //       await this.initAudioContext();
   //       if (!this.audioContext) return;

   //       const response = await fetch(url);
   //       if (!response.ok) return;

   //       const arrayBuffer = await response.arrayBuffer();
   //       const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
   //       this.sounds.set(name, audioBuffer);
   //    } catch (error) {
   //       console.warn(`Failed to load sound ${name}:`, error);
   //    }
   // }

   /**
    * Play a notification sound
    */
   public async playSound(soundName: string): Promise<void> {
      if (!this.isEnabled || !this.audioContext) return;

      try {
         await this.initAudioContext();
         if (!this.audioContext) return;

         const audioBuffer = this.sounds.get(soundName);
         if (!audioBuffer) {
            // Fallback to generic notification sound
            await this.playGenericSound();
            return;
         }

         const source = this.audioContext.createBufferSource();
         const gainNode = this.audioContext.createGain();

         source.buffer = audioBuffer;
         gainNode.gain.value = this.volume;

         source.connect(gainNode);
         gainNode.connect(this.audioContext.destination);

         source.start();
      } catch (error) {
         console.warn(`Failed to play sound ${soundName}:`, error);
      }
   }

   /**
    * Play a generic notification sound using built-in audio
    */
   private async playGenericSound(): Promise<void> {
      try {
         const audio = new Audio('/sounds/notification.mp3');
         audio.volume = this.volume;
         await audio.play();
      } catch (error) {
         console.warn('Failed to play generic notification sound:', error);
      }
   }

   /**
    * Play sound based on notification type
    */
   public async playNotificationSound(type: string): Promise<void> {
      const soundMap: Record<string, string> = {
         LIKE: 'like',
         COMMENT: 'comment',
         FOLLOW: 'notification',
         MESSAGE: 'message',
         CALL: 'call',
         MENTION: 'notification',
      };

      const soundName = soundMap[type] || 'notification';
      await this.playSound(soundName);
   }

   /**
    * Play success sound
    */
   public async playSuccess(): Promise<void> {
      await this.playSound('success');
   }

   /**
    * Play error sound
    */
   public async playError(): Promise<void> {
      await this.playSound('error');
   }

   /**
    * Enable/disable sounds
    */
   public setEnabled(enabled: boolean): void {
      this.isEnabled = enabled;
   }

   /**
    * Check if sounds are enabled
    */
   public getEnabled(): boolean {
      return this.isEnabled;
   }

   /**
    * Set volume (0.0 to 1.0)
    */
   public setVolume(volume: number): void {
      this.volume = Math.max(0, Math.min(1, volume));
   }

   /**
    * Get current volume
    */
   public getVolume(): number {
      return this.volume;
   }

   /**
    * Test sound functionality
    */
   public async testSound(): Promise<void> {
      await this.playSound('notification');
   }

   /**
    * Preload sounds after user interaction
    */
   public async preloadSounds(): Promise<void> {
      try {
         await this.initAudioContext();
      } catch (error) {
         console.warn('Failed to preload sounds:', error);
      }
   }
}

export const notificationSoundService = new NotificationSoundService();
