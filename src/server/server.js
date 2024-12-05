const http = require("http");
const server = http.createServer();

const io = require('socket.io')(server, {
	cors: {
		origin : '*'
	}
});

io.on('connection', client => {
	console.log(client);
});

const port = 5109;
io.listen(port);
console.log(`Servier listening on port ${port}`);
