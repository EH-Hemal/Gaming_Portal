export function slide2048(board,direction) {
  const result=[...board];let gained=0;
  for(let line=0;line<4;line++) {
    const ids=Array.from({length:4},(_,i)=>direction==='left'?line*4+i:direction==='right'?line*4+3-i:direction==='up'?i*4+line:(3-i)*4+line);
    const values=ids.map(i=>board[i]).filter(Boolean),merged=[];
    for(let i=0;i<values.length;i++) {if(values[i]===values[i+1]) {merged.push(values[i]*2);gained+=values[i]*2;i++;}else merged.push(values[i]);}
    ids.forEach((id,i)=>result[id]=merged[i]||0);
  }
  return {board:result,gained,changed:result.some((v,i)=>v!==board[i])};
}
export function addTile(board,rng=Math.random) {const empty=board.map((v,i)=>v?null:i).filter(v=>v!==null);if(!empty.length)return board;const copy=[...board];copy[empty[Math.floor(rng()*empty.length)]]=rng()<.9?2:4;return copy;}
export function canMove2048(board) {return board.includes(0)||['up','down','left','right'].some(d=>slide2048(board,d).changed);}
export function winner(board) {for(const [a,b,c] of [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]) if(board[a]&&board[a]===board[b]&&board[a]===board[c])return board[a];return board.every(Boolean)?'draw':null;}
export function computerMove(board) {
  function minimax(b,turn,depth=0) {const w=winner(b);if(w)return w==='O'?10-depth:w==='X'?depth-10:0;const scores=b.flatMap((v,i)=>{if(v)return [];const n=[...b];n[i]=turn;return [minimax(n,turn==='O'?'X':'O',depth+1)];});return turn==='O'?Math.max(...scores):Math.min(...scores);}
  let best=-Infinity,pick=-1;board.forEach((v,i)=>{if(!v){const b=[...board];b[i]='O';const score=minimax(b,'X');if(score>best){best=score;pick=i;}}});return pick;
}
export function slidingNeighbours(empty) {return [empty%4?empty-1:null,empty%4<3?empty+1:null,empty>3?empty-4:null,empty<12?empty+4:null].filter(i=>i!==null);}
export function shuffleSliding(rng=Math.random) {const b=Array.from({length:16},(_,i)=>(i+1)%16);let e=15,previous=-1;for(let i=0;i<200;i++){const choices=slidingNeighbours(e).filter(n=>n!==previous);const n=choices[Math.floor(rng()*choices.length)];[b[e],b[n]]=[b[n],b[e]];previous=e;e=n;}return b;}
