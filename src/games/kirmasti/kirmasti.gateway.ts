import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthGuard } from 'src/auth.guard';
import { redis } from 'src/redis';
import { UserSocket } from 'src/interfaces';
import { PlayerService } from '../player.service';
import { Status } from '../enums';
import { CardService } from '../card.service';
import { ICard } from '../deck.interface';

// @UseGuards(PlayerGuard)
@WebSocketGateway(2001)
export class KirmastiGateway {
  // private userSockets: Map<string, string> = new Map();
  private gameFlag: Map<string, boolean> = new Map();
  private dealedPlayers: Map<string, Set<string>> = new Map();
  private roomUsers: Map<string, Set<string>> = new Map();
  private roomDecks: Map<string, ICard[]> = new Map();
  private userHands: Map<string, ICard[]> = new Map();
  private playerService = new PlayerService();
  private cardService = new CardService();
  @WebSocketServer()
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
    //TODO: Interface for rooms
    if (Object.keys(room).length == 0)
      return console.log('No room to be found');

    // USERS CHECK
    let roomUsers = this.roomUsers.get(roomId);
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
    if (roomUsers.size > 1) {
      const emitInfo = { roomUsers, roomId };
      await this.startGame(emitInfo);
    }
  }

  @SubscribeMessage('leave-room')
  async leaveRoom(@ConnectedSocket() socket, @MessageBody() body) {
    const { roomId } = body;
    const userId = socket.user;
    const roomUsers = this.roomUsers.get(roomId);
    const userInTheRoom = roomUsers.has(userId);
    if (!userInTheRoom) return;

    roomUsers.delete(socket.user);
    this.roomUsers.set(roomId, roomUsers);
    redis.hset(`userId:${userId}`, 'currentStatus', Status.LOBBY);

    // console.log(`${socket.user} left the room: ${roomId}`);

    // TODO: Delete room if it's empty
    // TODO: socket.leave
  }

  // @SubscribeMessage('game-starts')
  async startGame(emitInfo) {
    await this.delay(3000);
    const { roomId, roomUsers } = emitInfo;
    const deck = this.cardService.createDeck(11, 12, 13, 1);
    this.roomDecks.set(roomId, deck);

    // FIRST PART
    await this.delay(5000);
    const dealedPlayers = this.dealedPlayers.get(roomId);
    for (const user of roomUsers) {
      const roomDeck = this.roomDecks.get(roomId);
      const [hand, currentDeck] = this.cardService.dealHand(roomDeck, 2);
      const sortedHand = hand.sort((a, b) => a.point - b.point);
      this.roomDecks.set(roomId, currentDeck);
      this.userHands.set(user, sortedHand);
      this.server.to(roomId).emit('cards', user);
      this.server.to(roomId).emit('cards', hand);
      // .emit('cards', { userHand: `${user}:${(hand[0], hand[1])}` });
    }

    //SECOND PART
    await this.delay(5000);

    const [finalCard, currentDeck] = this.cardService.dealHand(
      this.roomDecks.get(roomId),
      1,
    );
    this.server.to(roomId).emit('cards', finalCard[0]);
    const winners = [];
    for (const user of roomUsers) {
      const playerHand = this.userHands.get(user);

      //SORTING
      if (
        playerHand[0].point < finalCard[0].point &&
        playerHand[1].point > finalCard[0].point
      )
        winners.push(user);
    }

    // HANDLE WINNERS MONEY
    this.server.to(roomId).emit('cards', winners);

    //RESTART GAME
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

  @SubscribeMessage('fold')
  async fold() {}
  //

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
