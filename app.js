'use strict';

let uuidv4= require('uuid/v4');
let express = require('express');
let helmet = require('helmet');
let app = express();
app.use(helmet());
let serv = require('http').Server(app);
let io = require('socket.io')(serv, {});

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(8080);
console.log('Server started.')

let SOCKET_LIST = {};
let PLAYER_LIST = {};

let Player = function(id) {
	let player = {
		x:250,
		y:250,
		id:id,
		pressingRight:false,
		pressingLeft:false,
		pressingUp:false,
		pressingDown:false,
		maxSpd:10,
		color:('#'+Math.floor(Math.random()*16777215).toString(16)),

		updatePosition() {
			if(this.pressingRight)
				this.x += this.maxSpd;
			if(this.pressingLeft)
				this.x -= this.maxSpd;
			if(this.pressingUp)
				this.y -= this.maxSpd;
			if(this.pressingDown)
			    this.y += this.maxSpd;
		}
	}
	return player;
}

io.sockets.on('connection', socket => {
	console.log('socket connection')
	socket.id = uuidv4();
	SOCKET_LIST[socket.id] = socket;

	let player = Player(socket.id);
	PLAYER_LIST[socket.id] = player;

	socket.on('disconnect', () => {
		delete SOCKET_LIST[socket.id];
		delete PLAYER_LIST[socket.id];
	})

	socket.on('keyPress', (data) => {
		if(data.inputId === 'left')
			player.pressingLeft = data.state
		else if(data.inputId === 'right')
			player.pressingRight = data.state
		else if(data.inputId === 'up')
			player.pressingUp = data.state
		else if(data.inputId === 'down')
			player.pressingDown = data.state
	})
});

function updatePositions() {
	let posPacket = [];

	for(let i in PLAYER_LIST) {
		let p = PLAYER_LIST[i];
		p.updatePosition()
		posPacket.push({
			x:p.x,
			y:p.y,
			color:p.color
		});
	}

	for(let i in SOCKET_LIST) {
		let s = SOCKET_LIST[i];
		s.emit('updatePositions', posPacket)
	}
}

function tick() {
	updatePositions()
}

let fps = 30
setInterval(tick, 1000/fps)