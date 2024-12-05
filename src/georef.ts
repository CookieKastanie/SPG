import Geo from 'ecef-projector'
import { mat4, vec4 } from 'akila/math'

import { GeoPoint } from './point';

export class GeoReference
{
	private valid: boolean = false;

	private latitude: number = 0;
	private longitude: number = 0;
	private altitude: number = 0;

	private tangentMatrix: Array<number> = new Array(16);
	private inverseTangentMatrix: Array<number> = new Array(16);

	setup(lat: number, lon: number, alt: number = 0)
	{
		this.latitude = lat;
		this.longitude = lon;
		this.altitude = alt;

		const p = Geo.project(lat, lon, alt);
		mat4.lookAt(this.tangentMatrix, p, [0, 0, 0], [0, 0, 1]);
		mat4.invert(this.inverseTangentMatrix, this.tangentMatrix);

		this.valid = true;
	}

	makePointFromGeodetic(lat = 0, lon = 0, alt = 0)
	{
		const geoPoint = new GeoPoint();

		geoPoint.latitude = lat;
		geoPoint.longitude = lon;
		geoPoint.altitude = alt;

		const p = Geo.project(lat, lon, alt);

		let projected = new Array(4);
		vec4.transformMat4(projected, [p[0], p[1], p[2], 1], this.tangentMatrix);

		geoPoint.local[0] = projected[0];
		geoPoint.local[1] = projected[1];
		geoPoint.local[2] = projected[2];

		return geoPoint;
	}

	makePointFromLocal(x = 0, y = 0, z = 0)
	{
		const geoPoint = new GeoPoint();
		
		geoPoint.local[0] = x;
		geoPoint.local[1] = y;
		geoPoint.local[2] = z;

		let unprojected = new Array(4);
		vec4.transformMat4(unprojected, [x, y, z, 1], this.inverseTangentMatrix);

		const p = Geo.unproject(unprojected[0], unprojected[1], unprojected[2]);
		geoPoint.latitude = p[0];
		geoPoint.longitude = p[1];
		geoPoint.altitude = p[2];

		return geoPoint;
	}

	getLatitude()
	{
		return this.latitude;
	}

	getLLongitude()
	{
		return this.longitude;
	}

	getAltitude()
	{
		return this.altitude;
	}

	isValid()
	{
		return this.valid;
	}
}
