import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class KirmastiGateway {
  handleConnection(client: Socket) {
    console.log('user connected');
  }

  handleDisconnect(client: Socket) {
    console.log('user has left');
  }

  @SubscribeMessage('message')
  handleMessage(socket: Socket): string {
    console.log(socket.id);
    return 'Hello world!';
  }
}
