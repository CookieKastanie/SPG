const GeodeticPoint = require('./geodetic_point');
const { v4: uuidv4 } = require('uuid');

module.exports = class Marker
{
	constructor()
	{
		this.id = uuidv4();
		this.name = '';
		this.color = [1, 1, 1];
		this.geodeticPoint = new GeodeticPoint();
	}

	toObject()
	{
		return {
			id: this.id,
			name: this.name,
			color: [...this.color],
			point: this.geodeticPoint.toObject()
		};
	}

	fromObject(object)
	{
		if(!object)
		{
			return false;
		}

		if(typeof object.name === 'string')
		{
			this.name = object.name.substring(0, 32);
		}
		else
		{
			this.name = 'Inconnu';
		}

		if(Array.isArray(object.color) && object.color.length === 3)
		{
			const r = parseFloat(object.color[0]);
			const g = parseFloat(object.color[1]);
			const b = parseFloat(object.color[2]);

			if(!isNaN(r) && !isNaN(g) && !isNaN(b))
			{
				this.color[0] = r;
				this.color[1] = g;
				this.color[2] = b;
			}
		}

		const point = new GeodeticPoint();
		point.fromObject(object.point);
		if(point.isValid() == false)
		{
			return false;
		}

		this.geodeticPoint = point;

		return true;
	}
}
