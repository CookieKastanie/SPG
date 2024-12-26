import { XMLParser } from 'fast-xml-parser'
import { MapMeta, MapSkiSlope, MapFile } from './map_file';

export class OSMFile extends MapFile
{
	private osm: any = null; // the parsed osm (xml) object

	override loadData(raw: string)
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

	override parseMeta()
	{
		const meta = new MapMeta();

		meta.centerLatitude = (Number(this.osm.bounds.minlat) + Number(this.osm.bounds.maxlat)) * 0.5;
		meta.centerLongitude = (Number(this.osm.bounds.minlon) + Number(this.osm.bounds.maxlon)) * 0.5;
		meta.centerAltitude = 0;

		return meta;
	}

	override parseSkiSlopes()
	{
		const indexedNodes = new Map();
		for(const node of this.osm.node)
		{
			indexedNodes.set(node.id, node);
		}

		const skiSlopes: Array<MapSkiSlope> = [];
		for(const way of this.osm.way)
		{
			if(Array.isArray(way.tag) == false)
			{
				continue;
			}
	
			let isSkiSlope = false;
	
			const skiSlope = new MapSkiSlope();
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
