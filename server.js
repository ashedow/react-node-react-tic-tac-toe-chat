//Dependency
var express = require('express'),
		app = express(),
		http = require('http');

const PORT = process.env.PORT || 3000;
const INDEX = __dirname + '/app/index.html';
var server = http.createServer(app);
var io = require('socket.io').listen(server);
//Start server
server.listen(PORT, () => { console.log("Server starts on http://localhost:"+ PORT+" !")});  

io.on('connection', (socket)=> {
	var all_rooms=[];
	var room_name;
	var symbol;
	if (socket.current_room_name !== undefined) {
		socket.leave(socket.current_room_name);
		room_name=socket.id.toString();
		socket.join(room_name);
		symbol='X';
	}
	else
	{
		var urlapi = require('url'),
		url = urlapi.parse(socket.handshake.headers.referer);
		var itog_socketid = url.pathname.slice(1, -1);    
		if(itog_socketid==="")
		{
			room_name=socket.id.toString();
			socket.join(room_name);
			symbol='X';
		}    
		else
		{
			room_name=itog_socketid;
			var room = io.sockets.adapter.rooms[room_name];
			if(room !== undefined)
			{
				var number_of_clients_in_room = io.sockets.adapter.rooms[room_name].length;
				if(number_of_clients_in_room===1)
				{
					socket.join(room_name);
					symbol='O';
					socket.broadcast.to(room_name).emit('second_player');  
				}       
				else
				{
					room_name=socket.id.toString();
					socket.join(room_name);
					symbol='X';      
				}         
			}
			else
			{
				room_name=socket.id.toString();
				socket.join(room_name);
				symbol='X';
			}
		}
	}
	socket.emit('your_player_symbol_and_current_room', {my_symbol: symbol, room: room_name} );     
	socket.on('disconnect', (socket) => {
		io.to(room_name).emit('player_leaves');
		 var rooms = io.sockets.adapter.sids[socket.id];
		 for(var room in rooms) {
				 socket.leave(room);
		 };
	})
	socket.on('new-message', (msg)=> {
		io.to(room_name).emit('receive-message',msg); 
	});
});

app.use('/', express.static(__dirname + '/app'));
app.get('/', function(req, res){
	res.sendFile(__dirname + "/app/index.html");
});

app.use('/([a-zA-Z0-9_-]{20})/', express.static(__dirname + '/app'));
app.get('/([a-zA-Z0-9_-]{20})/', function(req, res){
	res.sendFile(__dirname + "/app/index.html");
});