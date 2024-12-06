const Marker = require('./marker')

module.exports = class client extends Marker
{
	constructor(socket)
	{
		super();
		this.socket = socket;
	}
}
