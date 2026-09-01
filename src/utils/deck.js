import { countingSystems } from '../data/countingSystems';
export const SUITS = ['spades','hearts','diamonds','clubs'];
export const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
export const suitSymbol = {spades:'♠', hearts:'♥', diamonds:'♦', clubs:'♣'};
export function createShoe(decks=6, system='hilo') {
  const cards=[];
  for(let d=1; d<=decks; d++) for(const suit of SUITS) for(const rank of RANKS) cards.push({
    id:`deck${d}-${suit}-${rank}`,
    suit, rank,
    blackjackValue: rank==='A'?11:['J','Q','K'].includes(rank)?10:Number(rank),
    countValue: countingSystems[system].values[rank],
  });
  return shuffle(cards);
}
export function shuffle(input){
  const a=[...input];
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
export const decksRemaining = cards => Math.max(cards/52, 0.25);
