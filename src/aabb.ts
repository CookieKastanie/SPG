import { vec3 } from "akila/math"

export class AABB
{
	min = vec3.fromValues(0, 0, 0);
	max = vec3.fromValues(0, 0, 0);

	reset()
	{
		vec3.set(this.min, Infinity, Infinity, Infinity);
		vec3.set(this.max, -Infinity, -Infinity, -Infinity);
	}

	add(other: AABB)
	{
		vec3.min(this.min, this.min, other.min);
		vec3.max(this.max, this.max, other.max);
	}

	combine(other: AABB)
	{
		const aabb = new AABB();

		vec3.min(aabb.min, this.min, other.min);
		vec3.max(aabb.max, this.max, other.max);
		
		return aabb;
	}
}
