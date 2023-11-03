import { InjectModel } from '@nestjs/mongoose';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Model } from 'mongoose';
import { Socket, Server } from 'socket.io';
import { AuthGuard } from 'src/auth.guard';
import { redis } from 'src/redis';
import { Kirmasti } from 'src/schemas/kirmasti.schema';
import { UseGuards } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { UserSocket } from 'src/interfaces';
import { PlayerService } from '../player.service';
import { Status } from '../enums';

// @UseGuards(PlayerGuard)
@WebSocketGateway(2001)
export class KirmastiGateway {
  private userSockets: Map<string, string> = new Map();
  private playerService: PlayerService;
  server: Server;
  constructor() {
    this.playerService = new PlayerService();
    this.server = new Server();
  }

  async handleConnection(client: UserSocket) {
    const statusChanged = await this.playerService.changePlayerStatus(
      client.user,
      Status.LOBBY,
    );
    if (!statusChanged) return client.disconnect();
    console.log(`enter => user:${client.user}, socket:${client.id}`);
  }

  handleDisconnect(client: UserSocket) {
    client.disconnect(true);
    this.playerService.changePlayerStatus(client.user, Status.OFFLINE);
    console.log(`left => user:${client.user}, socket:${client.id} `);
  }

  // JOIN ROOM
  @SubscribeMessage('join-room')
  async joinRoom(@ConnectedSocket() socket, @MessageBody() body) {
    console.log(`${socket.user} has joined`);
    socket.emit('message', 'yeod');
    // const roomId = body.roomId;

    // const room = await this.kirmastiModel.findOne({ _id: body.roomId });
    // if (!room) return;
    // console.log('Received join-room event:', body);
    // if (socket) {
    //   socket.join(body.room);
    //   console.log(`${socket.id} has joined to room ${body.room}.`);
    // } else {
    //   console.log('Socket object is undefined.');
    // }
  }

  @SubscribeMessage('accept-deal')
  async acceptDeal(@ConnectedSocket() Socket, @MessageBody() body) {}

  @SubscribeMessage('bet')
  async bet() {}

  //
}
