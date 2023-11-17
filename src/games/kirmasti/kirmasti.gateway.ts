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
  private gameFlag: Map<string, boolean> = new Map();
  private totalRoomBet: Map<string, number> = new Map();
  private userStatus: Map<string, string> = new Map();
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
    // leave room
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
    const { callBet, dealBet } = await this.getRoomAmounts(roomId);
    // TODO: Add level check
    // TODO: Add money check
    const userId = socket.user;

    const room = await redis.hgetall(`roomId:${roomId}`);
    //TODO: Interface for rooms
    if (Object.keys(room).length == 0)
      return console.log('No room to be found');

    // USERS CHECK
    const userMoney = parseInt(
      await redis.hget(`userId:${userId}`, 'currentMoney'),
    );

    if (userMoney < callBet + dealBet) return console.log('not enough money');

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
    const gameHasBegun = this.gameFlag.get(roomId);
    if (roomUsers.size > 1 && !gameHasBegun) {
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

    await this.playerService.handleUserLeave(userId);
    roomUsers.delete(socket.user);
    this.roomUsers.set(roomId, roomUsers);
    redis.hset(`userId:${userId}`, 'currentStatus', Status.LOBBY);
    socket.leave(roomId);

    // console.log(`${socket.user} left the room: ${roomId}`);

    // TODO: Delete room if it's empty
    // TODO: Change flag back to false when only 1 user left
  }

  // @SubscribeMessage('game-starts')
  async startGame(emitInfo) {
    const { roomId, roomUsers } = emitInfo;
    this.gameFlag.set(roomId, true);
    await this.delay(3000);
    const deck = this.cardService.createDeck(11, 12, 13, 1);
    this.roomDecks.set(roomId, deck);

    // FIRST PART
    this.dealedPlayers.set(roomId, new Set());
    await this.delay(5000);
    let dealedPlayers = this.dealedPlayers.get(roomId);
    for (const user of dealedPlayers) {
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
    this.dealedPlayers.set(roomId, new Set());
    await this.delay(5000);
    dealedPlayers = this.dealedPlayers.get(roomId);
    const [finalCard, currentDeck] = this.cardService.dealHand(
      this.roomDecks.get(roomId),
      1,
    );
    this.server.to(roomId).emit('cards', finalCard[0]);
    const winners = [];
    for (const user of dealedPlayers) {
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
    //

    //RESTART GAME
  }

  // RoomGuard
  @SubscribeMessage('accept-deal')
  async acceptDeal(@ConnectedSocket() socket, @MessageBody() body) {
    const { roomId } = body;
    const userId = socket.user;

    const { dealBet } = await this.getRoomAmounts(roomId);
    // const totalUserBets = this.userBets.get(socket.user);

    // this.userBets.set(socket.user, totalUserBets + dealBet);
    await this.playerService.handleBet(userId, dealBet);
    const dealedPlayers = this.dealedPlayers.get(roomId);
    dealedPlayers.add(socket.user);
    this.dealedPlayers.set(roomId, dealedPlayers);

    const totalRoomBet = this.totalRoomBet.get(roomId);
    this.totalRoomBet.set(roomId, totalRoomBet + dealBet);
  }

  @SubscribeMessage('bet')
  async bet(@MessageBody() body, @ConnectedSocket() socket) {
    const { roomId } = body;
    const userId = socket.user;

    const { callBet } = await this.getRoomAmounts(roomId);
    // const totalUserBets = this.userBets.get(socket.user);

    // this.userBets.set(socket.user, totalUserBets + callBet);
    await this.playerService.handleBet(userId, callBet);
    const dealedPlayers = this.dealedPlayers.get(roomId);
    dealedPlayers.add(socket.user);
    this.dealedPlayers.set(roomId, dealedPlayers);

    const totalRoomBet = this.totalRoomBet.get(roomId);
    this.totalRoomBet.set(roomId, totalRoomBet + callBet);
  }

  @SubscribeMessage('fold')
  async fold() {}
  //

  async getRoomAmounts(roomId) {
    const { callBet, dealBet } = await redis.hgetall(`roomId:${roomId}`);

    return { callBet: parseInt(callBet), dealBet: parseInt(dealBet) };
  }

  async handleEndGame(roomId, winners: string[]) {
    if (winners.length == 0) return;
    const totalRoomBet = this.totalRoomBet.get(roomId);
    const winnersMoney = (totalRoomBet * 0.025) / winners.length;

    for (const winner of winners) {
      await this.playerService.handleUserWinning(winner, winnersMoney);
    }

    const roomUsers = this.roomUsers.get(roomId);

    for (const user of roomUsers) {
      await redis.hset(`userId:${user}`, 'currentBet', 0);
    }
    this.totalRoomBet.set(roomId, 0);
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
