import { GeodeticLocation } from './point';

export class MapMeta
{
	centerLatitude: number;
	centerLongitude: number;
	centerAltitude: number;
}

export class MapSkiSlope
{
	id: string = '';
	name: string = '';
	difficulty: string = 'novice';
	points: Array<GeodeticLocation> = [];
}

export class MapFile
{
	loadData(raw: string)
	{
		
	}

	parseMeta()
	{
		return new MapMeta();
	}

	parseSkiSlopes()
	{
		return new Array<MapSkiSlope>();
	}
}
