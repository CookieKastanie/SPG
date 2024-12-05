import { XMLParser } from 'fast-xml-parser'
import { GeodeticLocation } from './point';

export class OSMMeta
{
	centerLatitude: number;
	centerLongitude: number;
	centerAltitude: number;
}

export class OSMSkiSlope
{
	id: string = '';
	name: string = '';
	difficulty: string = 'novice';
	points: Array<GeodeticLocation> = [];
}

export class OSMFile
{
	private osm: any = null; // the parsed osm (xml) object

	loadData(raw: string)
	{
		const options = {
			ignoreAttributes: false,
			attributeNamePrefix: ''
		};

		const parser = new XMLParser(options);
		const data = parser.parse(raw, true);
		if(data)
		{
			this.osm = data.osm;
		}
	}

	parseMeta()
	{
		const meta = new OSMMeta();

		meta.centerLatitude = (Number(this.osm.bounds.minlat) + Number(this.osm.bounds.maxlat)) * 0.5;
		meta.centerLongitude = (Number(this.osm.bounds.minlon) + Number(this.osm.bounds.maxlon)) * 0.5;
		meta.centerAltitude = 0;

		return meta;
	}

	parseSkiSlopes()
	{
		const indexedNodes = new Map();
		for(const node of this.osm.node)
		{
			indexedNodes.set(node.id, node);
		}

		const skiSlopes: Array<OSMSkiSlope> = [];
		for(const way of this.osm.way)
		{
			if(Array.isArray(way.tag) == false)
			{
				continue;
			}
	
			let isSkiSlope = false;
	
			const skiSlope = new OSMSkiSlope();
			skiSlope.id = way.id;
	
			for(const tag of way.tag)
			{
				if(tag.k === 'name')
				{
					skiSlope.name = tag.v;
				}
	
				// https://wiki.openstreetmap.org/wiki/Key:piste:difficulty
				if(tag.k === 'piste:difficulty')
				{
					skiSlope.difficulty = tag.v;
				}
	
				if(tag.k === 'piste:type')
				{
					isSkiSlope = tag.v === 'downhill';
				}
			}
	
			if(isSkiSlope === false)
			{
				continue;
			}
	
			if(skiSlope.name == '')
			{
				continue
			}
	
			for(const nd of way.nd)
			{
				const node = indexedNodes.get(nd.ref);
				skiSlope.points.push({latitude: Number(node.lat), longitude: Number(node.lon), altitude: 0});
			}
	
			skiSlopes.push(skiSlope);
		}
	
		return skiSlopes;
	}
}








/*/
const stringToDifficulty = (s: string) => {
	switch(s)
	{
		case 'novice': return PisteDifficulty.NOVICE;
		case 'easy': return PisteDifficulty.EASY;
		case 'intermediate': return PisteDifficulty.INTERMEDIATE;
		case 'advanced': return PisteDifficulty.ADVANCED;
		case 'expert': return PisteDifficulty.EXPERT;
		case 'freeride': return PisteDifficulty.FREERIDE;
		case 'extreme': return PisteDifficulty.EXTREME;
	}

	return PisteDifficulty.NOVICE;
}

export const parseOSM = (osmData: string, geoRef: GeoReference) => {
	const options = {
		ignoreAttributes: false,
		attributeNamePrefix: ''
	};

	const parser = new XMLParser(options);
	const osm = parser.parse(osmData, true);

	geoRef.setup(
		(Number(osm.osm.bounds.minlat) + Number(osm.osm.bounds.maxlat)) * 0.5,
		(Number(osm.osm.bounds.minlon) + Number(osm.osm.bounds.maxlon)) * 0.5
	);

	const indexedNodes = new Map();
	for(const node of osm.osm.node)
	{
		indexedNodes.set(node.id, node);
	}

	const pistes: Array<OSMSkiSlope> = [];
	for(const way of osm.osm.way)
	{
		if(Array.isArray(way.tag) == false)
		{
			continue;
		}

		let isPiste = false;

		const piste = new OSMSkiSlope();
		piste.id = way.id;

		for(const tag of way.tag)
		{
			if(tag.k === 'name')
			{
				piste.name = tag.v;
			}

			// https://wiki.openstreetmap.org/wiki/Key:piste:difficulty
			if(tag.k === 'piste:difficulty')
			{
				piste.difficulty = tag.v;
			}

			if(tag.k === 'piste:type')
			{
				isPiste = tag.v === 'downhill';
			}
		}

		if(isPiste === false)
		{
			continue;
		}

		if(piste.name == '')
		{
			continue
		}

		for(const nd of way.nd)
		{
			const node = indexedNodes.get(nd.ref);
			piste.points.push(geoRef.makePointFromGeodetic(Number(node.lat), Number(node.lon)));
		}

		pistes.push(piste);
	}

	return pistes;
}
//*/
