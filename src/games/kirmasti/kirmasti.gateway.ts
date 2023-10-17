import { InjectModel } from '@nestjs/mongoose';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Model } from 'mongoose';
import { Socket } from 'socket.io';
import { Kirmasti } from 'src/schemas/kirmasti.schema';

@WebSocketGateway(2001, { namespace: 'kirmasti' })
export class KirmastiGateway {
  constructor(
    @InjectModel(Kirmasti.name) private kirmastiModel: Model<Kirmasti>,
  ) {}
  handleConnection(client: Socket) {
    console.log(`${client.id} connected`);
  }

  handleDisconnect(client: Socket) {
    console.log('user has left');
  }

  @SubscribeMessage('message')
  handleMessage(socket: Socket): string {
    console.log(socket.id);
    return 'Hello world!';
  }

  // JOIN ROOM
  @SubscribeMessage('join-room')
  async joinRoom(@ConnectedSocket() socket, @MessageBody() body) {
    const room = await this.kirmastiModel.findOne({ _id: body.roomId });
    if (!room) return;
    console.log('Received join-room event:', body);
    if (socket) {
      socket.join(body.room);
      console.log(`${socket.id} has joined to room ${body.room}.`);
    } else {
      console.log('Socket object is undefined.');
    }
  }

  @SubscribeMessage('accept-deal')
  async acceptDeal() {}

  @SubscribeMessage('bet')
  async bet() {}

  //
}
