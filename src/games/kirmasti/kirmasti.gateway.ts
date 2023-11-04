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
import { BadRequestException, UseGuards } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { UserSocket } from 'src/interfaces';
import { PlayerService } from '../player.service';
import { Status } from '../enums';

// @UseGuards(PlayerGuard)
@WebSocketGateway(2001)
export class KirmastiGateway {
  private userSockets: Map<string, string> = new Map();
  roomUsers: Map<string, Set<string>> = new Map();
  private playerService = new PlayerService();
  server: Server;
  constructor() {
    //this.playerService = new PlayerService();
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

  // TODO: Fix Bug
  handleDisconnect(client: UserSocket) {
    client.disconnect(true);
    this.playerService.changePlayerStatus(client.user, Status.OFFLINE);
    console.log(`left => user:${client.user}, socket:${client.id} `);
  }

  // CREATE ROOM
  async createRoom() {
    // -9-----------------------
  }

  // JOIN ROOM
  @SubscribeMessage('join-room')
  async joinRoom(@ConnectedSocket() socket, @MessageBody() body) {
    const { roomId } = body;
    // set check
    // level check
    const userId = socket.user;

    const room = await redis.hgetall(`roomId:${roomId}`);
    console.log(room);
    if (Object.keys(room).length == 0)
      return console.log('No room to be found');

    // USERS CHECK
    let roomUsers = this.roomUsers.get(roomId);
    console.log(roomUsers);
    if (roomUsers == undefined) {
      this.roomUsers.set(roomId, new Set());
      roomUsers = new Set();
    }
    if (roomUsers.size >= parseInt(room.maxUsers))
      return console.log('Max users!');
    const playerStatus = await this.playerService.changePlayerStatus(
      userId,
      Status.ROOM,
    );
    if (!playerStatus) return;

    console.log(`${socket.user} has joined`);
    socket.join(roomId);

    roomUsers.add(userId);
    this.roomUsers.set(roomId, roomUsers); // try different users
    socket.emit('message', room);
  }

  @SubscribeMessage('leave-room')
  async leaveRoom(@ConnectedSocket() socket, @MessageBody() body) {
    const { roomId } = body;
    console.log(`${socket.user} left the room: ${roomId}`);
  }

  @SubscribeMessage('accept-deal')
  async acceptDeal(@ConnectedSocket() Socket, @MessageBody() body) {}

  @SubscribeMessage('bet')
  async bet() {}

  //
}
