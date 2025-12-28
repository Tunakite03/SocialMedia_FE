import { apiService } from './apiService';
import type { ApiResponse } from '@/types';

class CallService {
   private readonly endpoint = '/calls';

   async initiateCall(): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}/initiate`);
   }

   async answerCall(id: string): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}/${id}/answer`);
   }

   async notifyConnectionEstablished(id: string): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}/${id}/established`);
   }

   async endCall(id: string): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}/${id}/end`);
   }
}

export const callService = new CallService();
