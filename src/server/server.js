const http = require('http');
const server = http.createServer();

const io = require('socket.io')(server, {
	cors: {
		origin : '*'
	}
});



const Client = require('./client');
const Marker = require('./marker');

const clients = new Map();
const markers = new Map();

const syncNewClient = (socket) => {
	for(const [_, client] of clients)
	{
		if(client.geodeticPoint.isValid() == false)
		{
			continue;
		}

		socket.emit('client_data', client.toObject());
	}

	for(const [_, marker] of markers)
	{
		socket.emit('marker_data', marker.toObject());
	}
}

const broadcast = (name, data, exeptId = '') => {
	for(const [_, client] of clients)
	{
		if(client.id != exeptId)
		{
			client.socket.emit(name, data);
		}
	}
}

io.on('connection', socket => {
	syncNewClient(socket);
	clients.set(socket.id, new Client(socket));

	socket.on('client_data', data => {
		const client = clients.get(socket.id);
		if(client.fromObject(data))
		{
			broadcast('client_data', client.toObject(), client.id);
		}
	});

	socket.on('marker_data', data => {
		if(markers.size >= 128)
		{
			socket.emit('error_info', {msg: 'Too many markers !'});
			return;
		}

		let marker;
		if(markers.has(data.id))
		{
			marker = markers.get(data.id);
		}
		else
		{
			marker = new Marker();
		}

		if(marker.fromObject(data))
		{
			markers.set(marker.id, marker);
			broadcast('marker_data', marker.toObject());
		}
	});

	socket.on('marker_delete', data => {
		if(markers.has(data.id))
		{
			markers.delete(data.id);
			broadcast('marker_delete', {id: data.id});
		}
	});

	socket.on('disconnect', reason => {
		if(clients.has(socket.id))
		{
			const client = clients.get(socket.id);
			broadcast('client_delete', {id: client.id}, client.id);
			clients.delete(socket.id);
		}
	});
});

const port = 5109;
io.listen(port);
console.log(`Servier listening on port ${port}`);
