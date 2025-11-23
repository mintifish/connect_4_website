const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

// Simple static file server
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' ) reqPath = '/index.html';
  const filePath = path.join(publicDir, decodeURIComponent(reqPath));
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()){
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const types = {
      '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
      '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
    };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
});

const wss = new WebSocket.Server({ server });

server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));

const rows = 6, cols = 7;
const rooms = new Map(); // roomId -> { players: [ws, ws], board, current }

function makeBoard(){
  return Array.from({length: rows}, ()=>Array(cols).fill(null));
}

function dropDisc(board, col, player){
  for(let r = rows-1; r >= 0; r--){
    if(board[r][col] === null){
      board[r][col] = player;
      return r;
    }
  }
  return -1;
}

function checkWinner(board, r, c, player){
  if(r < 0) return false;
  // directions: horizontal, vertical, diag1, diag2
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for(const [dr,dc] of dirs){
    let count = 1;
    // forward
    for(let k=1;k<4;k++){
      const rr = r + dr*k, cc = c + dc*k;
      if(rr<0||rr>=rows||cc<0||cc>=cols) break;
      if(board[rr][cc] === player) count++; else break;
    }
    // backward
    for(let k=1;k<4;k++){
      const rr = r - dr*k, cc = c - dc*k;
      if(rr<0||rr>=rows||cc<0||cc>=cols) break;
      if(board[rr][cc] === player) count++; else break;
    }
    if(count >= 4) return true;
  }
  return false;
}

function isBoardFull(board){
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) if(board[r][c] === null) return false;
  return true;
}

function send(ws, obj){
  try{ ws.send(JSON.stringify(obj)); }catch(e){}
}

wss.on('connection', function connection(ws){
  ws.on('message', function incoming(raw){
    let msg;
    try{ msg = JSON.parse(raw); }catch(e){ send(ws,{type:'error', message:'invalid json'}); return }

    if(msg.type === 'join'){
      const roomId = String(msg.room || '');
      if(!rooms.has(roomId)){
        rooms.set(roomId, { players: [], board: makeBoard(), current: 0 });
      }
      const room = rooms.get(roomId);
      if(room.players.length >= 2){
        send(ws,{type:'error', message:'room full'});
        return;
      }
      ws.roomId = roomId;
      ws.playerIndex = room.players.length;
      room.players.push(ws);
      send(ws, {type:'joined', room: roomId});
      // inform other
      if(room.players.length === 2){
        // start game
        room.board = makeBoard();
        room.current = 0;
        // send start to both
        for(let i=0;i<2;i++){
          const player = room.players[i];
          send(player, {type:'start', playerIndex: i});
          send(player, {type:'update', board: room.board, current: room.current});
        }
      }
    }

    else if(msg.type === 'move'){
      const roomId = ws.roomId;
      if(!roomId || !rooms.has(roomId)) { send(ws,{type:'error', message:'not in a room'}); return }
      const room = rooms.get(roomId);
      const player = ws.playerIndex;
      if(player === undefined || player === null){ send(ws,{type:'error', message:'invalid player'}); return }
      if(room.players[room.current] !== ws){ send(ws,{type:'error', message:'not your turn'}); return }
      const col = Number(msg.col);
      if(isNaN(col) || col < 0 || col >= cols){ send(ws,{type:'error', message:'invalid column'}); return }
      const row = dropDisc(room.board, col, player);
      if(row === -1){ send(ws,{type:'error', message:'column full'}); return }
      // check win
      const won = checkWinner(room.board, row, col, player);
      if(won){
        // broadcast game_over
        for(const p of room.players){ send(p, {type:'game_over', winner: player, board: room.board}); }
        // reset room (keep it so players can rematch by re-joining)
        rooms.delete(roomId);
        return;
      }
      if(isBoardFull(room.board)){
        for(const p of room.players) send(p, {type:'game_over', winner: null, board: room.board});
        rooms.delete(roomId);
        return;
      }
      // advance turn
      room.current = 1 - room.current;
      // broadcast moved/update
      for(const p of room.players) send(p, {type:'moved', board: room.board, current: room.current});
    }

  });

  ws.on('close', ()=>{
    const roomId = ws.roomId;
    if(roomId && rooms.has(roomId)){
      const room = rooms.get(roomId);
      // notify remaining player
      for(const p of room.players){ if(p !== ws){ send(p, {type:'error', message:'opponent disconnected'}); try{ p.close(); }catch(e){} } }
      rooms.delete(roomId);
    }
  });
});

process.on('SIGINT', ()=>{ console.log('Shutting down'); process.exit(); });
