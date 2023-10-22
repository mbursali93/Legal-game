import { InjectModel } from '@nestjs/mongoose';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Model } from 'mongoose';
import { Socket } from 'socket.io';
import { AuthGuard } from 'src/auth.guard';
import { redis } from 'src/redis';
import { Kirmasti } from 'src/schemas/kirmasti.schema';
import { UseGuards } from '@nestjs/common';
import { verify } from 'jsonwebtoken';

@UseGuards(AuthGuard)
@WebSocketGateway(2001, { namespace: 'kirmasti' })
export class KirmastiGateway {
  private userSockets: Map<string, string> = new Map();
  constructor(
    @InjectModel(Kirmasti.name) private kirmastiModel: Model<Kirmasti>,
  ) {}

  handleConnection(client: Socket) {
    const token = client.request.headers.authorization;
    const { userId } = verify(token, process.env.JWT_SECRET) as any;
    const userConnected = this.userSockets.has(userId);
    if (userConnected) return this.handleDisconnect(client);
    this.userSockets.set(userId, client.id);
  }

  handleDisconnect(client: Socket) {
    client.disconnect(true);
    console.log('user has left');
  }

  // JOIN ROOM
  @SubscribeMessage('join-room')
  async joinRoom(@ConnectedSocket() socket, @MessageBody() body) {
    console.log(`${socket.user} has joined`);
    const roomId = body.roomId;

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
  async acceptDeal(@ConnectedSocket() Socket, @MessageBody() body) {}

  @SubscribeMessage('bet')
  async bet() {}

  //
}
