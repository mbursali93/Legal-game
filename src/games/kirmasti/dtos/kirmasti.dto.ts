import { IsInt, Min, Max } from 'class-validator';
export class KirmastiDto {
  @IsInt({ message: 'Call-Bet value must be integer.' })
  @Min(50, { message: 'Call-Bet value can not be smaller than 50.' })
  @Max(10000, { message: 'Call-Bet value can not be higher than 5.' })
  callBet: number;

  @IsInt({ message: 'Deal-Bet value must be integer.' })
  @Min(100, { message: 'Deal-Bet value can not be smaller than 100.' })
  @Max(10000, { message: 'Deal-Bet value can not be higher than 5.' })
  dealBet: number;

  @IsInt({ message: 'Max users value must be integer.' })
  @Min(2, { message: 'Max users value can not be smaller than 2.' })
  @Max(5, { message: 'Max users value can not be higher than 5.' })
  maxUsers: number;
}
