import { ICard } from './deck.interface';

export class CardService {
  private readonly suits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
  private readonly points = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  private readonly values = [
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'J',
    'Q',
    'K',
    'A',
  ];

  createDeck(
    jackPoint = 10,
    queenPoint = 10,
    kingPoint = 10,
    acePoint = 11,
  ): ICard[] {
    const deck = [];
    const points = [...this.points, jackPoint, queenPoint, kingPoint, acePoint];
    for (let i = 0; i < this.suits.length; i++) {
      for (let j = 0; j < this.values.length; j++) {
        deck.push({
          suit: this.suits[i],
          value: this.values[j],
          point: points[j],
        });
      }
    }

    return deck;
  }

  //   suffleDeck() {}

  //   private getCurrentDeck() {}

  dealHand(deck: ICard[], numberOfCards) {
    const hand = [];

    for (let i = 0; i < numberOfCards; i++) {
      const randomIndex = Math.ceil(Math.random() * deck.length);
      hand.push(deck[randomIndex]);
      deck.splice(randomIndex, 1);
    }

    return [hand, deck];
  }
}
