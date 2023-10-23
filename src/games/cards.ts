class Deck {
  suits: string[];
  values: string[];
  points: number[];

  constructor(
    acePoint: number = 11,
    jackPoint: number = 10,
    queenPoint: number = 10,
    kingPoint: number = 10,
  ) {
    this.suits = ['Hearts', 'Aces', 'Clubs', 'Diamonds'];
    this.values = [
      'A',
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
    ];
    this.points = [
      acePoint,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      jackPoint,
      queenPoint,
      kingPoint,
    ];
  }

  createDeck(howManyDecks: number, additionalCards?: object[]) {
    const deck: object[] = [];

    for (let d = 0; d < howManyDecks; d++) {
      // to create a single deck
      for (let i = 0; i < this.suits.length; i++) {
        for (let j = 0; j < this.values.length; j++) {
          deck.push({
            suit: this.suits[i],
            value: this.values[j],
            point: this.points[j],
          });
        }
      }
    }

    if (additionalCards) return [...deck, ...additionalCards];
    return deck;
  }
}

export default Deck;
