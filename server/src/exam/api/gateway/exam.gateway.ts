// device.gateway.ts
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({})
export class ExamGateway {
  @WebSocketServer()
  server: Server;

  sendExamEvent(event: string, payload: any) {
    this.server.emit(event, payload);
  }
}
