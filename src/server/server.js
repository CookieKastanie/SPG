// input: h in [0,360] and s,v in [0,1] - output: r,g,b in [0,1]
const hsv2rgb = (h,s,v) => {
	let f= (n,k=(n+h/60)%6) => v - v*s*Math.max(Math.min(k,4-k,1), 0);     
	return [f(5),f(3),f(1)];  
}

const randomColor = () => {
	return hsv2rgb(Math.random() * 360, 1, 1);
}


const express = require('express');
const fs = require('fs');
const config = require('./config.json');

const app = express();
let server;

if(config.use_ssl)
{
	const https = require('https');
	server = https.createServer({
		key: fs.readFileSync(config.certificate_key_path, 'utf8'),
		cert: fs.readFileSync(config.certificate_path, 'utf8')
	}, app);
}
else
{
	const http = require('http');
	server = http.createServer({}, app);
}

app.use(express.static('public'));

const io = require('socket.io')(server, {
	cors: {
		origin: config.cors_origin,
		credentials: true
	}
});

////////

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

	const newClient = new Client(socket);
	clients.set(socket.id, newClient);
	newClient.color = randomColor();

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
			marker.color = randomColor();
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

server.listen(config.port);
console.log(`Servier listening on port ${config.port}`);
