import { evaluateHand } from './blackjack';
const up = c => c.rank==='A' ? 11 : c.blackjackValue;
export function basicStrategy(playerCards, dealerCard, rules={}){
  const h=evaluateHand(playerCards), d=up(dealerCard);
  if(h.pair){
    const r=playerCards[0].rank;
    if(['A','8'].includes(r)) return 'split';
    if(['10','J','Q','K'].includes(r)) return 'stand';
    if(r==='9') return [2,3,4,5,6,8,9].includes(d)?'split':'stand';
    if(r==='7') return d<=7?'split':'hit';
    if(r==='6') return d<=6?'split':'hit';
    if(r==='5') return d<=9?'double':'hit';
    if(r==='4') return [5,6].includes(d)&&rules.doubleAfterSplit?'split':'hit';
    if(['2','3'].includes(r)) return d<=7?'split':'hit';
  }
  if(h.soft){
    if(h.total>=19) return 'stand';
    if(h.total===18) return d>=3&&d<=6?'double':d>=9?'hit':'stand';
    if(h.total===17) return d>=3&&d<=6?'double':'hit';
    if([15,16].includes(h.total)) return d>=4&&d<=6?'double':'hit';
    if([13,14].includes(h.total)) return d>=5&&d<=6?'double':'hit';
  }
  if(h.total>=17) return 'stand';
  if(h.total>=13) return d<=6?'stand':'hit';
  if(h.total===12) return d>=4&&d<=6?'stand':'hit';
  if(h.total===11) return 'double';
  if(h.total===10) return d<=9?'double':'hit';
  if(h.total===9) return d>=3&&d<=6?'double':'hit';
  return 'hit';
}
