export function evaluateHand(cards){
  let total=cards.reduce((s,c)=>s+c.blackjackValue,0);
  let aces=cards.filter(c=>c.rank==='A').length;
  while(total>21 && aces>0){ total-=10; aces--; }
  const soft=cards.some(c=>c.rank==='A') && aces>0;
  const blackjack=cards.length===2 && total===21;
  const pair=cards.length===2 && cards[0].blackjackValue===cards[1].blackjackValue;
  return {total, soft, blackjack, bust:total>21, pair, splittable:pair};
}
export function dealerShouldHit(cards, hitSoft17=false){
  const h=evaluateHand(cards);
  return h.total<17 || (h.total===17 && h.soft && hitSoft17);
}
export function settle(player, dealer, bet, naturalEligible=true, payout=1.5){
  const p=evaluateHand(player), d=evaluateHand(dealer);
  if(p.bust) return {result:'Bust', delta:-bet};
  if(d.blackjack && !(p.blackjack&&naturalEligible)) return {result:'Loss',delta:-bet};
  if(p.blackjack&&naturalEligible && !d.blackjack) return {result:'Blackjack',delta:bet*payout};
  if(d.bust) return {result:'Dealer Bust',delta:bet};
  if(p.total>d.total) return {result:'Win',delta:bet};
  if(p.total<d.total) return {result:'Loss',delta:-bet};
  return {result:'Push',delta:0};
}
