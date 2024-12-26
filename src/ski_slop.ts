import { AABB } from "./aabb";
import { GeoPoint } from "./point";
import { sdLine } from "./sd";
import { vec3 } from "akila/math";


export enum SkiSlopeDifficulty
{
	NOVICE,
	EASY,
	INTERMEDIATE,
	ADVANCED,
	EXPERT, 
	FREERIDE,
	EXTREME
}

export const stringToSkiSlopeDifficulty = (s: string) => {
	switch(s)
	{
		case 'novice': return SkiSlopeDifficulty.NOVICE;
		case 'easy': return SkiSlopeDifficulty.EASY;
		case 'intermediate': return SkiSlopeDifficulty.INTERMEDIATE;
		case 'advanced': return SkiSlopeDifficulty.ADVANCED;
		case 'expert': return SkiSlopeDifficulty.EXPERT;
		case 'freeride': return SkiSlopeDifficulty.FREERIDE;
		case 'extreme': return SkiSlopeDifficulty.EXTREME;
	}

	return SkiSlopeDifficulty.NOVICE;
}

export const skiSlopeDifficultyToString = (s: SkiSlopeDifficulty) => {
	switch(s)
	{
		case SkiSlopeDifficulty.NOVICE: return 'novice';
		case SkiSlopeDifficulty.EASY: return 'easy';
		case SkiSlopeDifficulty.INTERMEDIATE: return 'intermediate';
		case SkiSlopeDifficulty.ADVANCED: return 'advanced';
		case SkiSlopeDifficulty.EXPERT: return 'expert';
		case SkiSlopeDifficulty.FREERIDE: return 'freeride';
		case SkiSlopeDifficulty.EXTREME: return 'extreme';
	}
	
	return 'novice';
}

export class SkiSlope
{
	id: string = '';
	name: string = '';
	difficulty: SkiSlopeDifficulty = SkiSlopeDifficulty.NOVICE;
	points: Array<GeoPoint> = [];
	aabb: AABB = new AABB();

	computeDistance(point: GeoPoint): number
	{
		let closest = Infinity;
		for(let i = 0; i < this.points.length - 1; ++i)
		{
			const p0 = this.points[i];
			const p1 = this.points[i + 1];

			const dist = sdLine(point, p0, p1);
			if(dist < closest)
			{
				closest = dist;
			}
		}

		return closest;
	}

	computeAABB()
	{
		for(const point of this.points)
		{
			vec3.min(this.aabb.min, this.aabb.min, point.local);
			vec3.max(this.aabb.max, this.aabb.max, point.local);
		}
	}
}
