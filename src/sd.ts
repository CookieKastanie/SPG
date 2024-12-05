import { vec3 } from 'akila/math'
import { LocalLocation } from './point';

const pa = vec3.create();
const ba = vec3.create();
export const sdLine = (p: LocalLocation, a: LocalLocation, b: LocalLocation) => {
	vec3.sub(pa, p.local, a.local);
	vec3.sub(ba, b.local, a.local);

	const h = Math.min(Math.max(vec3.dot(pa, ba) / vec3.dot(ba, ba) , 0), 1);
	return vec3.length(vec3.sub(pa, pa, vec3.scale(ba, ba, h)));
}

const p = vec3.create();
export const pointsInRange = (a: LocalLocation, b: LocalLocation, r: number) => {
	vec3.sub(p, b.local, a.local);
	return vec3.dot(p, p) <= r * r;
}
