import { GeoReference } from "./georef";
import { SkiSlope, stringToSkiSlopeDifficulty } from "./ski_slop";
import { MapFile } from "./map_file";
import { GeoPoint } from "./point";
import { AABB } from "./aabb";

export class ClosestSlopeResponse
{
	requestPoint: GeoPoint;
	skiSlope: SkiSlope;
	distance: number = Infinity;
}

export class SkiResort
{
	private skiSlopes: Map<string, SkiSlope> = new Map();
	private geoRef: GeoReference = new GeoReference();
	private aabb: AABB = new AABB();

	load(file: MapFile)
	{
		if(this.geoRef.isValid() == false)
		{
			const meta = file.parseMeta();
			this.geoRef.setup(meta.centerLatitude, meta.centerLongitude, meta.centerAltitude);
			this.aabb.reset();
		}

		const fileSlopes = file.parseSkiSlopes();
		
		for(const fileSlope of fileSlopes)
		{
			if(this.skiSlopes.has(fileSlope.id))
			{
				continue;
			}

			const skiSlope = new SkiSlope();
			skiSlope.id = fileSlope.id;
			skiSlope.name = fileSlope.name;
			skiSlope.difficulty = stringToSkiSlopeDifficulty(fileSlope.difficulty);
			for(const point of fileSlope.points)
			{
				const geoPoint = this.geoRef.makePointFromGeodetic(point.latitude, point.longitude, point.altitude);
				skiSlope.points.push(geoPoint);
			}

			skiSlope.computeAABB();
			this.aabb.add(skiSlope.aabb);

			this.skiSlopes.set(skiSlope.id, skiSlope);
		}
	}

	getGeoReference()
	{
		return this.geoRef;
	}

	getSkiSlopes()
	{
		return this.skiSlopes;
	}

	getAABB()
	{
		return this.aabb;
	}

	requestClosestSlope(lat: number, lon: number, alt: number = 0, range: number = 50)
	{
		const geoPoint = this.geoRef.makePointFromGeodetic(lat, lon, alt);

		const closest = new ClosestSlopeResponse();
		closest.requestPoint = geoPoint;

		for(const [_, slope] of this.skiSlopes)
		{
			const dist = slope.computeDistance(geoPoint);
			if(dist <= range && dist < closest.distance)
			{
				closest.skiSlope = slope;
				closest.distance = dist;
			}
		}

		return closest;
	}
}
