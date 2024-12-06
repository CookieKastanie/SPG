module.exports = class GeodeticPoint
{
	constructor()
	{
		this.latitude = NaN;
		this.longitude = NaN;
		this.altitude = 0;
	}

	fromObject(object)
	{
		if(!object)
		{
			return false;
		}

		this.latitude = parseFloat(object.lat);
		this.longitude = parseFloat(object.lon);
		this.altitude = parseFloat(object.alt);

		if(isNaN(this.altitude))
		{
			this.altitude = 0;
		}

		return this.isValid();
	}

	isValid()
	{
		return !isNaN(this.latitude) && !isNaN(this.longitude) && !isNaN(this.altitude);
	}

	toObject()
	{
		return {lat: this.latitude, lon: this.longitude, alt: this.altitude};
	}
}
