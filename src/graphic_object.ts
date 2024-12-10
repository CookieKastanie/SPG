import { VAO, VBO } from 'akila/webgl'
import { vec3, mat4 } from 'akila/math'

import { SkiSlope, SkiSlopeDifficulty } from './ski_slop';
import { GeoPoint } from './point';

export class SkiSlopeMesh
{
	private vao: any;
	private color = vec3.fromValues(1, 1, 1);

	constructor(skiSlope: SkiSlope)
	{
		const data = new Float32Array(skiSlope.points.length * 3);
		let i = 0;
		for(const point of skiSlope.points)
		{
			data[i + 0] = point.local[0];
			data[i + 1] = point.local[1];
			data[i + 2] = point.local[2];

			i += 3;
		}

		this.vao = new VAO(VAO.LINE_STRIP);
		this.vao.addVBO(new VBO(data, 3, 0));

		this.color = vec3.fromValues(1, 1, 1);
		switch(skiSlope.difficulty)
		{
			case SkiSlopeDifficulty.NOVICE:       this.color = vec3.fromValues(0.298, 0.686, 0.314); break;
			case SkiSlopeDifficulty.EASY:         this.color = vec3.fromValues(0.098, 0.463, 0.824); break;
			case SkiSlopeDifficulty.INTERMEDIATE: this.color = vec3.fromValues(0.957, 0.263, 0.212); break;
			case SkiSlopeDifficulty.ADVANCED:     this.color = vec3.fromValues(0.129, 0.129, 0.129); break;
			case SkiSlopeDifficulty.EXPERT:       this.color = vec3.fromValues(0.984, 0.549, 0); break;
			case SkiSlopeDifficulty.FREERIDE:
			case SkiSlopeDifficulty.EXTREME:      this.color = vec3.fromValues(1, 0.933, 0.345); break;
		}
	}

	getColor()
	{
		return this.color;
	}

	draw()
	{
		this.vao.draw();
	}

	delete()
	{
		this.vao.delete();
	}
}

export class MarkerMesh
{
	private vao: any;
	color = vec3.fromValues(1, 1, 1);
	private matrix = mat4.create();
	position: GeoPoint = new GeoPoint();

	constructor(color = [1, 1, 1])
	{
		this.color = new Float32Array(color);

		this.vao = new VAO(VAO.TRIANGLE_FAN);
		const data = new Float32Array([-10, -10,  10, -10,  10, 10,  -10, 10]);
		const vbo = new VBO(data, 2, 0);
		this.vao.addVBO(vbo);
	}

	getModelMatrix()
	{
		mat4.fromTranslation(this.matrix, vec3.fromValues(this.position.local[0], this.position.local[1], this.position.local[2]));
		return this.matrix;
	}

	draw()
	{
		this.vao.draw();
	}
}
