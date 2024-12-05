import { GeoReference } from "./georef";
import { SkiSlope, stringToSkiSlopeDifficulty } from "./ski_slop";
import { OSMFile } from "./oms_parser";
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

	loadOSM(data: string)
	{
		const osm = new OSMFile();
		osm.loadData(data);

		if(this.geoRef.isValid() == false)
		{
			const meta = osm.parseMeta();
			this.geoRef.setup(meta.centerLatitude, meta.centerLongitude, meta.centerAltitude);
			this.aabb.reset();
		}

		const osmSlopes = osm.parseSkiSlopes();
		for(const osmSlope of osmSlopes)
		{
			if(this.skiSlopes.has(osmSlope.id))
			{
				continue;
			}

			const skiSlope = new SkiSlope();
			skiSlope.id = osmSlope.id;
			skiSlope.name = osmSlope.name;
			skiSlope.difficulty = stringToSkiSlopeDifficulty(osmSlope.difficulty);
			for(const point of osmSlope.points)
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
