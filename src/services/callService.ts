import { apiService } from './apiService';
import type { ApiResponse } from '@/types';

interface InitiateCallPayload {
   conversationId: string;
   type: 'AUDIO' | 'VIDEO';
}

interface InitiateCallResponse {
   call: {
      id: string;
      conversationId: string;
      type: 'AUDIO' | 'VIDEO';
      status: string;
      createdAt: string;
   };
}

interface LiveKitTokenResponse {
   token: string;
   wsUrl: string;
   roomName: string;
}

class CallService {
   private readonly endpoint = '/calls';

   async initiateCall(payload: InitiateCallPayload): Promise<ApiResponse<InitiateCallResponse>> {
      return apiService.post<InitiateCallResponse>(`${this.endpoint}/initiate`, payload);
   }

   async answerCall(id: string): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}/${id}/answer`);
   }

   async rejectCall(id: string): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}/${id}/reject`);
   }

   async getLiveKitToken(id: string): Promise<ApiResponse<LiveKitTokenResponse>> {
      return apiService.get<LiveKitTokenResponse>(`${this.endpoint}/${id}/livekit/token`);
   }

   async endCall(id: string): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}/${id}/end`);
   }
}

export const callService = new CallService();
