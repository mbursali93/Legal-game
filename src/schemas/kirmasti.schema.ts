import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type KirmastiDocument = HydratedDocument<Kirmasti>;

@Schema()
export class Kirmasti {
  @Prop()
  maxPlayers: number;

  @Prop()
  smallBet: number;

  @Prop()
  highBet: number;

  @Prop()
  roomOwner: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const KirmastiSchema = SchemaFactory.createForClass(Kirmasti);
