import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthGuard } from 'src/auth.guard';
import { redis } from 'src/redis';
import { UserSocket } from 'src/interfaces';
import { PlayerService } from '../player.service';
import { Status } from '../enums';
import { CardService } from '../card.service';

// @UseGuards(PlayerGuard)
@WebSocketGateway(2001)
export class KirmastiGateway {
  private userSockets: Map<string, string> = new Map();
  private roomUsers: Map<string, Set<string>> = new Map();
  private playerService = new PlayerService();
  private cardService = new CardService();
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
    // TODO: Add level check
    const userId = socket.user;

    const room = await redis.hgetall(`roomId:${roomId}`);
    console.log(room); //TODO: Interface for rooms
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

    // GAME STARTS
    // Flag controls
  }

  @SubscribeMessage('leave-room')
  async leaveRoom(@ConnectedSocket() socket, @MessageBody() body) {
    const { roomId } = body;
    console.log(this.roomUsers.get(roomId));
    const userId = socket.user;
    const roomUsers = this.roomUsers.get(roomId);
    const userInTheRoom = roomUsers.has(userId);
    if (!userInTheRoom) return;

    roomUsers.delete(socket.user);
    this.roomUsers.set(roomId, roomUsers);
    redis.hset(`userId:${userId}`, 'currentStatus', Status.LOBBY);

    // console.log(`${socket.user} left the room: ${roomId}`);
    console.log(this.roomUsers.get(roomId));
  }

  @SubscribeMessage('game-starts')
  async startGame() {
    // kartlar dağıtılır.
    // bahis istenir.
    // yeni kartlar açılır
    //yeni bahis istenir
    // sonuca göre hesap görülür ve yeni ele başlanır..
  }

  @SubscribeMessage('accept-deal')
  async acceptDeal(@ConnectedSocket() socket, @MessageBody() body) {
    const deck = this.cardService.createDeck(11, 12, 13, 1);
    const [hand, newDeck] = this.cardService.dealHand(deck, 2);

    socket.emit('test', newDeck);
    console.log(hand);
  }

  @SubscribeMessage('bet')
  async bet() {}

  //
}
