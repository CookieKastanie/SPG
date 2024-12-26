import { MapMeta, MapSkiSlope, MapFile } from './map_file';
import { SkiResort } from './ski_resort';
import { skiSlopeDifficultyToString } from './ski_slop';

export class JSONMapFile extends MapFile
{
	private json: any = null;

	override loadData(raw: string)
	{
		this.json = JSON.parse(raw);
	}

	override parseMeta()
	{
		const meta = new MapMeta();

		meta.centerLatitude = this.json.meta.latitude;
		meta.centerLongitude = this.json.meta.longitude;
		meta.centerAltitude = this.json.meta.altitude;

		return meta;
	}

	override parseSkiSlopes()
	{
		const skiSlopes: Array<MapSkiSlope> = [];

		for(const sdata of this.json.slopes)
		{
			const skiSlope = new MapSkiSlope();
			skiSlope.id = sdata.id;
			skiSlope.name = sdata.name;
			skiSlope.difficulty = sdata.difficulty;
			
			for(const p of sdata.points)
			{
				skiSlope.points.push({latitude: p[0], longitude: p[1], altitude: p[2]});
			}

			skiSlopes.push(skiSlope);
		}

		return skiSlopes;
	}

	write(resort: SkiResort)
	{
		const jsonData = {
			meta: {
				latitude: resort.getGeoReference().getLatitude(),
				longitude: resort.getGeoReference().getLongitude(),
				altitude: resort.getGeoReference().getAltitude(),
			},
			slopes: []
		} as any;

		for(const [id, slope] of resort.getSkiSlopes())
		{
			const data = {
				id,
				name: slope.name,
				difficulty: skiSlopeDifficultyToString(slope.difficulty),
				points: []
			} as any;

			slope.points.forEach(p => {
				data.points.push([p.latitude, p.longitude,  p.altitude]);
			});

			jsonData.slopes.push(data);
		}

		return JSON.stringify(jsonData);
	}
}
