import { Display, Shader } from 'akila/webgl'
import { FirstPersonCamera } from 'akila/utils'
import { Time } from 'akila/time'
import { vec2, vec3, vec4, mat4 } from 'akila/math'

import { SkiSlopeMesh, MarkerMesh } from './graphic_object'

import { SkiResort } from './ski_resort'
import { io } from 'socket.io-client'
import { MapCamera } from './camera'
import { JSONMapFile } from './json_map_parser'
import { UI } from './ui'
import { VILLARD_DATA } from './raw_json'

const time = new Time();

let display: any;
let camera: any;
let shader: any;

let skiResort = new SkiResort();
let skiSlopeMeshes: Array<SkiSlopeMesh> = [];
let clientMeshs: Map<string, MarkerMesh> = new Map();
let markerMeshs: Map<string, MarkerMesh> = new Map();



let socket: any;
const port = 5109;

const setupConnection = () => {
	socket = io(`:${port}`);

	socket.on('connect', () => {
		console.log(socket.id);

		navigator.geolocation.watchPosition(e => {
			console.log(e);
			if(!socket)
			{
				return;
			}
		
			socket.emit('client_data', {point: {lat: e.coords.latitude, lon: e.coords.longitude, alt: e.coords.altitude}});
		});
		console.log(navigator.geolocation.getCurrentPosition(console.log));
		console.log("start geoloc");

	});
	
	socket.on('disconnect', () => {
		console.log(socket.id);
	});
	
	socket.on('error_info', (data: any) => {
		console.log(data);
	});
	
	socket.on('client_data', (data: any) => {
		const result = skiResort.requestClosestSlope(data.point.lat, data.point.lon);
		let client;
		if(clientMeshs.has(data.id))
		{
			client = clientMeshs.get(data.id);
		}
		else
		{
			client = new MarkerMesh(data.color);
			clientMeshs.set(data.id, client);
		}
	
		console.log('client_data', data, result);
		client.position = result.requestPoint;
	});
	
	socket.on('marker_data', (data: any) => {
		const result = skiResort.requestClosestSlope(data.point.lat, data.point.lon);
		
		let marker;
		if(markerMeshs.has(data.id))
		{
			marker = markerMeshs.get(data.id);
		}
		else
		{
			marker = new MarkerMesh(data.color);
			markerMeshs.set(data.id, marker);
		}
	
		console.log('marker_data', data, result);
		marker.position = result.requestPoint;
	});
	
	socket.on('client_delete', (data: any) => {
		clientMeshs.delete(data.id);
	});
	
	socket.on('marker_delete', (data: any) => {
		markerMeshs.delete(data.id);
	});
}



declare global {
    interface Window { setMarkerPosition: any; }
	interface Window { writeJson: any; }
}

window.setMarkerPosition = (lat: number, lon: number) => {
	socket.emit('marker_data', {point: {lat, lon}});
}

window.writeJson = () => {
	console.log(new JSONMapFile().write(skiResort));
}




time.onInit(() => {
	display = new Display(window.innerWidth, window.innerHeight, {webGLVersion: 2, antialias: true, canvas: null});
	display.setClearColor(0.5, 0.5, 0.5, 1);
	
	//camera = new FirstPersonCamera(display.getWidth(), display.getHeight());
	camera = new MapCamera(display.canvas);
	//camera.setPosition([0, 0, 25]);
	//camera.setAngle([0, -Math.PI / 2, 0]);

	window.addEventListener('resize', e => {
		display.canvas.width = window.innerWidth;
		display.canvas.height = window.innerHeight;

		camera.setSize(display.canvas.width, display.canvas.height);
	});

	

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
	display.useDefaultFrameBuffer();

	camera.update(Time.delta);
	const aabb = skiResort.getAABB();
//*/
	if(camera.position[0] < aabb.min[0]) camera.position[0] = aabb.min[0];
	if(camera.position[1] < aabb.min[1]) camera.position[1] = aabb.min[1];
	//if(camera.position[2] < aabb.min[2]) camera.position[2] = aabb.min[2];
	if(camera.position[2] < 5) camera.position[2] = 5;

	if(camera.position[0] > aabb.max[0]) camera.position[0] = aabb.max[0];
	if(camera.position[1] > aabb.max[1]) camera.position[1] = aabb.max[1];
	//if(camera.position[2] > aabb.max[2]) camera.position[2] = aabb.max[2];
	if(camera.position[2] > 50) camera.position[2] = 50;
//*/

	camera.prepareMatrix();

	display.enable(Display.DEPTH_TEST);

	display.clear();

	shader.use();
	shader.sendMat4("VP", camera.getVPMatrix());
	shader.sendMat4("M", mat4.create());

	for(const p of skiSlopeMeshes)
	{
		shader.sendVec3("color", p.getColor());
		p.draw();
	}

	display.disable(Display.DEPTH_TEST);

	for(const [_, marker] of markerMeshs)
	{
		shader.sendMat4("M", marker.getModelMatrix());
		shader.sendVec3("color", marker.color);
		marker.draw();
	}
});



const ui = new UI();

const loadJsonData = (data: string) => {
	const json = new JSONMapFile();
	json.loadData(data);

	skiResort = new SkiResort();
	skiResort.load(json);

	for(const m of skiSlopeMeshes)
	{
		m.delete();
	}
	
	skiSlopeMeshes = [];

	for(const [_, slope] of skiResort.getSkiSlopes())
	{
		skiSlopeMeshes.push(new SkiSlopeMesh(slope));
	}

	for(const [_, marker] of markerMeshs)
	{
		const result = skiResort.requestClosestSlope(marker.position.latitude, marker.position.longitude);
		marker.position = result.requestPoint;
		console.log(result);
	}
}

ui.showConnectionMenu((n) => {console.log('name:', n);
	time.start();
	loadJsonData(VILLARD_DATA);
	setupConnection();
});

///////

/*/
document.querySelector('#osm-file')?.addEventListener('change', event => {
	const input = <HTMLInputElement>event.target;

	if(input.files && input.files[0])
	{
		const reader = new FileReader();

		reader.onload = e => {
			const data: string = e.target.result as string;

			const osm = new OSMFile();
			osm.loadData(data);
			skiResort.load(osm);

			for(const m of skiSlopeMeshes)
			{
				m.delete();
			}
			
			skiSlopeMeshes = [];

			for(const [_, slope] of skiResort.getSkiSlopes())
			{
				skiSlopeMeshes.push(new SkiSlopeMesh(slope));
			}

			for(const [_, marker] of markerMeshs)
			{
				const result = skiResort.requestClosestSlope(marker.position.latitude, marker.position.longitude);
				marker.position = result.requestPoint;
				console.log(result);
			}
		};

		reader.readAsText(input.files[0]);
	}
});

document.querySelector('#json-file')?.addEventListener('change', event => {
	const input = <HTMLInputElement>event.target;

	if(input.files && input.files[0])
	{
		const reader = new FileReader();

		reader.onload = e => {
			const data: string = e.target.result as string;

			const json = new JSONMapFile();
			json.loadData(data);

			skiResort = new SkiResort();
			skiResort.load(json);

			for(const m of skiSlopeMeshes)
			{
				m.delete();
			}
			
			skiSlopeMeshes = [];

			for(const [_, slope] of skiResort.getSkiSlopes())
			{
				skiSlopeMeshes.push(new SkiSlopeMesh(slope));
			}

			for(const [_, marker] of markerMeshs)
			{
				const result = skiResort.requestClosestSlope(marker.position.latitude, marker.position.longitude);
				marker.position = result.requestPoint;
				console.log(result);
			}
		};

		reader.readAsText(input.files[0]);
	}
});
//*/
