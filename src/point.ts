export interface LocalLocation
{
	local: Array<number>;
}

export interface GeodeticLocation
{
	latitude: number;
	longitude: number;
	altitude: number;
}

export class GeoPoint implements LocalLocation, GeodeticLocation
{
	local = [0, 0, 0];

	latitude = 0;
	longitude = 0;
	altitude = 0;
}
