import {
   Room,
   RoomEvent,
   Track,
   ConnectionQuality,
   RemoteParticipant,
   type RemoteTrackPublication,
} from 'livekit-client';
import { apiService } from './apiService';

interface LiveKitTokenResponse {
   token: string;
   wsUrl: string;
   roomName: string;
}

type ParticipantCallback = (participant: RemoteParticipant) => void;
type TrackCallback = (track: Track, publication: RemoteTrackPublication, participant: RemoteParticipant) => void;
type ConnectionQualityCallback = (quality: ConnectionQuality, participant: RemoteParticipant) => void;
type DisconnectCallback = (reason?: string) => void;

class LiveKitService {
   private room: Room | null = null;
   private currentCallId: string | null = null;

   // Event callbacks
   onParticipantConnected?: ParticipantCallback;
   onParticipantDisconnected?: ParticipantCallback;
   onTrackSubscribed?: TrackCallback;
   onTrackUnsubscribed?: TrackCallback;
   onConnectionQualityChanged?: ConnectionQualityCallback;
   onDisconnected?: DisconnectCallback;

   /**
    * Join a call using LiveKit
    */
   async joinCall(callId: string, options?: { enableVideo?: boolean; enableAudio?: boolean }): Promise<Room> {
      try {
         console.log(`[LiveKit] Joining call: ${callId}`, options);

         // 1. Get token from backend
         const response = await apiService.get<LiveKitTokenResponse>(`/calls/${callId}/livekit/token`);
         const data = response.data;
         if (!data) {
            throw new Error('Failed to get LiveKit token');
         }
         const { token, wsUrl, roomName } = data;

         console.log(`[LiveKit] Token received, connecting to room: ${roomName}`);

         // 2. Create room instance
         this.room = new Room({
            adaptiveStream: true,
            dynacast: true,
            // Disable automatic reconnection - end call immediately on disconnect
            reconnectPolicy: {
               nextRetryDelayInMs: () => null, // No reconnection attempts
            },
            videoCaptureDefaults: {
               resolution: {
                  width: 1280,
                  height: 720,
                  frameRate: 30,
               },
            },
            audioCaptureDefaults: {
               autoGainControl: true,
               echoCancellation: true,
               noiseSuppression: true,
            },
         });

         this.currentCallId = callId;

         // 3. Setup event listeners BEFORE connecting
         this.setupRoomListeners();

         // 4. Connect to room
         await this.room.connect(wsUrl, token);
         console.log(`[LiveKit] Connected to room: ${roomName}`);

         // 5. Enable media based on options
         const enableVideo = options?.enableVideo ?? true;
         const enableAudio = options?.enableAudio ?? true;

         await this.enableMedia(enableVideo, enableAudio);

         return this.room;
      } catch (error) {
         console.error('[LiveKit] Failed to join call:', error);
         this.cleanup();
         throw error;
      }
   }

   /**
    * Enable camera and/or microphone
    */
   async enableMedia(enableVideo: boolean = true, enableAudio: boolean = true): Promise<void> {
      if (!this.room) {
         throw new Error('[LiveKit] Room not initialized');
      }

      try {
         if (enableVideo && enableAudio) {
            await this.room.localParticipant.enableCameraAndMicrophone();
            console.log('[LiveKit] Camera and microphone enabled');
         } else if (enableAudio) {
            await this.room.localParticipant.setMicrophoneEnabled(true);
            console.log('[LiveKit] Microphone enabled (video disabled)');
         } else if (enableVideo) {
            await this.room.localParticipant.setCameraEnabled(true);
            console.log('[LiveKit] Camera enabled (audio disabled)');
         }
      } catch (error) {
         console.error('[LiveKit] Failed to enable media:', error);
         throw error;
      }
   }

   /**
    * Setup room event listeners
    */
   private setupRoomListeners(): void {
      if (!this.room) return;

      // Participant connected
      this.room.on(RoomEvent.ParticipantConnected, (participant) => {
         console.log(`[LiveKit] Participant joined: ${participant.identity}`);
         this.onParticipantConnected?.(participant);
      });

      // Participant disconnected
      this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
         console.log(`[LiveKit] Participant left: ${participant.identity}`);
         this.onParticipantDisconnected?.(participant);
      });

      // Track subscribed (remote video/audio)
      this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
         console.log(`[LiveKit] Track subscribed: ${track.kind} from ${participant.identity}`);
         this.onTrackSubscribed?.(track, publication as RemoteTrackPublication, participant);
      });

      // Track unsubscribed
      this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
         console.log(`[LiveKit] Track unsubscribed: ${track.kind} from ${participant.identity}`);
         this.onTrackUnsubscribed?.(track, publication as RemoteTrackPublication, participant);
      });

      // Connection quality changed
      this.room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
         console.log(`[LiveKit] Connection quality: ${quality} for ${participant.identity}`);
         if (participant instanceof RemoteParticipant) {
            this.onConnectionQualityChanged?.(quality, participant);
         }
      });

      // Disconnected
      this.room.on(RoomEvent.Disconnected, (reason) => {
         console.log(`[LiveKit] Disconnected: ${reason}`);
         this.onDisconnected?.(reason?.toString());
      });
   }

   /**
    * Leave call and cleanup
    */
   async leaveCall(): Promise<void> {
      try {
         console.log('[LiveKit] Leaving call...');

         if (this.room) {
            await this.room.disconnect();
         }

         if (this.currentCallId) {
            // Notify backend that call ended
            await apiService.post(`/calls/${this.currentCallId}/end`);
         }

         this.cleanup();
         console.log('[LiveKit] Left call successfully');
      } catch (error) {
         console.error('[LiveKit] Error leaving call:', error);
         this.cleanup();
      }
   }

   /**
    * Toggle video on/off
    */
   async toggleVideo(): Promise<boolean> {
      if (!this.room) return false;

      const enabled = this.room.localParticipant.isCameraEnabled;
      await this.room.localParticipant.setCameraEnabled(!enabled);
      console.log(`[LiveKit] Video ${!enabled ? 'enabled' : 'disabled'}`);
      return !enabled;
   }

   /**
    * Toggle audio on/off
    */
   async toggleAudio(): Promise<boolean> {
      if (!this.room) return false;

      const enabled = this.room.localParticipant.isMicrophoneEnabled;
      await this.room.localParticipant.setMicrophoneEnabled(!enabled);
      console.log(`[LiveKit] Audio ${!enabled ? 'enabled' : 'disabled'}`);
      return !enabled;
   }

   /**
    * Switch camera (front/back on mobile)
    */
   async switchCamera(): Promise<void> {
      if (!this.room) return;

      const videoTrack = this.room.localParticipant.getTrackPublication(Track.Source.Camera);
      if (
         videoTrack?.track &&
         'switchCamera' in videoTrack.track &&
         typeof videoTrack.track.switchCamera === 'function'
      ) {
         await videoTrack.track.switchCamera('environment');
         console.log('[LiveKit] Camera switched');
      }
   }

   /**
    * Set video device
    */
   async setVideoDevice(deviceId: string): Promise<void> {
      if (!this.room) return;
      await this.room.switchActiveDevice('videoinput', deviceId);
      console.log(`[LiveKit] Video device changed to: ${deviceId}`);
   }

   /**
    * Set audio device
    */
   async setAudioDevice(deviceId: string): Promise<void> {
      if (!this.room) return;
      await this.room.switchActiveDevice('audioinput', deviceId);
      console.log(`[LiveKit] Audio device changed to: ${deviceId}`);
   }

   /**
    * Get available devices
    */
   async getDevices(): Promise<{ video: MediaDeviceInfo[]; audio: MediaDeviceInfo[] }> {
      const devices = await Room.getLocalDevices('videoinput', true);
      const audioDevices = await Room.getLocalDevices('audioinput', true);
      return {
         video: devices,
         audio: audioDevices,
      };
   }

   /**
    * Cleanup resources
    */
   private cleanup(): void {
      this.room = null;
      this.currentCallId = null;
   }

   /**
    * Check if currently in a call
    */
   isInCall(): boolean {
      return this.room !== null && this.room.state === 'connected';
   }

   /**
    * Get current participants
    */
   getParticipants(): RemoteParticipant[] {
      if (!this.room) return [];
      return Array.from(this.room.remoteParticipants.values());
   }

   /**
    * Get local participant
    */
   getLocalParticipant() {
      return this.room?.localParticipant;
   }

   /**
    * Get room instance
    */
   getRoom(): Room | null {
      return this.room;
   }

   /**
    * Get current call ID
    */
   getCurrentCallId(): string | null {
      return this.currentCallId;
   }
}

// Export singleton instance
export const livekitService = new LiveKitService();
