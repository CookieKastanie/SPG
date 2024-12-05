import { Display, Shader } from 'akila/webgl'
import { FirstPersonCamera } from 'akila/utils'
import { Time } from 'akila/time'
import { vec2, vec3, vec4, mat4 } from 'akila/math'

import { SkiSlopeMesh, MarkerMesh } from './graphic_object'

import { SkiResort } from './ski_resort'
import { io } from 'socket.io-client'

const time = new Time();

let display: any;
let camera: any;
let shader: any;

let skiResort = new SkiResort();
let skiSlopeMeshes: Array<SkiSlopeMesh> = [];
let marker: MarkerMesh;

//*/
declare global {
    interface Window { setMarkerPosition: any; }
}

window.setMarkerPosition = (lat: number, lon: number) => {

	const result = skiResort.requestClosestSlope(lat, lon);
	marker.position = result.requestPoint;
	console.log(result, marker);
}
//*/

time.onInit(() => {
	display = new Display(1280, 720, {webGLVersion: 2, antialias: true, canvas: null});
	display.setClearColor(0.5, 0.5, 0.5, 1);
	camera = new FirstPersonCamera(1280, 720);
	camera.setPosition([0, 0, 25]);
	camera.setAngle([0, -Math.PI / 2, 0]);

	marker = new MarkerMesh();

	shader = new Shader(`#version 300 es
	precision mediump float;

	layout(location = 0) in vec3 a_vertexData;

	uniform mat4 VP;
	uniform mat4 M;

	void main()
	{
		gl_Position = VP * M * vec4(a_vertexData, 1.0);
	}
	`, `#version 300 es
	precision mediump float;

	uniform vec3 color;

	out vec4 fragColor;

	void main()
	{
		fragColor = vec4(color, 1.0);
	}
	`);
});

time.onTick(() => {

});

time.onDraw(() => {
	camera.update();
	const aabb = skiResort.getAABB();
//*/
	if(camera.position[0] < aabb.min[0] * 0.01) camera.position[0] = aabb.min[0] * 0.01;
	if(camera.position[1] < aabb.min[1] * 0.01) camera.position[1] = aabb.min[1] * 0.01;
	//if(camera.position[2] < aabb.min[2] * 0.01) camera.position[2] = aabb.min[2] * 0.01;
	if(camera.position[2] < 5) camera.position[2] = 5;

	if(camera.position[0] > aabb.max[0] * 0.01) camera.position[0] = aabb.max[0] * 0.01;
	if(camera.position[1] > aabb.max[1] * 0.01) camera.position[1] = aabb.max[1] * 0.01;
	//if(camera.position[2] > aabb.max[2] * 0.01) camera.position[2] = aabb.max[2] * 0.01;
	if(camera.position[2] > 50) camera.position[2] = 50;
//*/
	display.clear();

	shader.use();
	shader.sendMat4("VP", camera.getVPMatrix());
	shader.sendMat4("M", mat4.create());

	for(const p of skiSlopeMeshes)
	{
		shader.sendVec3("color", p.getColor());
		p.draw();
	}

	shader.sendMat4("M", marker.getModelMatrix());
	shader.sendVec3("color", marker.color);
	marker.draw();
});

time.start();


///////


document.querySelector('#file-input')?.addEventListener('change', event => {
	const input = <HTMLInputElement>event.target;

	if(input.files && input.files[0])
	{
		const reader = new FileReader();

		reader.onload = e => {
			const data: string = e.target.result as string;
			skiResort.loadOSM(data);

			for(const m of skiSlopeMeshes)
			{
				m.delete();
			}

			skiSlopeMeshes = [];

			for(const [_, slope] of skiResort.getSkiSlopes())
			{
				skiSlopeMeshes.push(new SkiSlopeMesh(slope));
			}
		};

		reader.readAsText(input.files[0]);
	}
});


/*/
const socket = io(':5109');

socket.on("connect", () => {
	console.log(socket.id); // x8WIv7-mJelg7on_ALbx
});

socket.on("disconnect", () => {
	console.log(socket.id); // undefined
});
//*/
