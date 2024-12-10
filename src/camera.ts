import { Camera } from 'akila/utils'
import { Mouse } from 'akila/inputs'
import { mat4 } from 'akila/math'

class Touch
{
	id: number;

	x: number;
	y: number;

	lastX: number;
	lastY: number;

	velX: number;
	velY: number;

	constructor(id: number, x: number, y: number)
	{
		this.id = id;

		this.x = x;
		this.y = y;

		this.lastX = x;
		this.lastY = y;

		this.velX = 0;
		this.velY = 0;
	}

	update(x: number, y: number)
	{
		this.velX = x - this.x;
		this.velY = y - this.y;

		this.lastX = this.x;
		this.lastY = this.y;

		this.x = x;
		this.y = y;
	}

	isVelZero()
	{
		return (Math.abs(this.velX) + Math.abs(this.velY)) <= 0.00001;
	}

	computeVelMag()
	{
		return Math.hypot(this.velX, this.velY);
	}
}

class Gesture
{
	private touches: Array<Touch> = [];

	constructor(canvas: HTMLCanvasElement)
	{
		canvas.addEventListener('touchstart', e => {
			e.preventDefault();

			for(const touchEvent of e.touches)
			{
				const index = this.touches.findIndex(t => t.id == touchEvent.identifier);
				if(index > -1)
				{
					continue;
				}

				const touch = new Touch(touchEvent.identifier, touchEvent.clientX, touchEvent.clientY);
				this.touches.push(touch);
			}
		});

		const endcallback = (e: TouchEvent) => {
			e.preventDefault();

			if(e.touches.length == 0)
			{
				this.touches = [];
			}
			else
			{
				for(let i = this.touches.length - 1; i >= 0; --i)
				{
					let found = false;
					for(const touchEvent of e.touches)
					{
						if(touchEvent.identifier == this.touches[i].id)
						{
							found = true;
							break;
						}
					}
					
					if(found == false)
					{
						this.touches.splice(i, 1);
					}
				}
			}
		}

		canvas.addEventListener('touchend', endcallback);
		canvas.addEventListener('touchcancel', endcallback);

		canvas.addEventListener('touchmove', e => {
			e.preventDefault();

			for(const touchEvent of e.touches)
			{
				const index = this.touches.findIndex(t => t.id == touchEvent.identifier);
				if(index <= -1)
				{
					continue;
				}

				this.touches[index].update(touchEvent.clientX, touchEvent.clientY);
			}
		});
	}

	getVelX()
	{
		if(this.touches.length == 0)
		{
			return 0;
		}
		
		return this.touches[0].velX;
	}

	getVelY()
	{
		if(this.touches.length == 0)
		{
			return 0;
		}
		
		return this.touches[0].velY;
	}

	getZoomVel()
	{
		if(this.touches.length < 2)
		{
			return 0;
		}

		let touch0 = this.touches[0];
		let touch1 = this.touches[1];

		if(touch0.isVelZero() || touch1.isVelZero())
		{
			return 0;
		}

		const pMag = touch0.computeVelMag();
		const sMag = touch1.computeVelMag();

		const px = touch0.velX / pMag;
		const py = touch0.velY / pMag;

		const sx = touch1.velX / sMag;
		const sy = touch1.velY / sMag;

		const p = px * sx + py * sy;
		if(p > -0.5)
		{
			return 0;
		}

		const mean = (pMag + sMag) * 0.5;

		let cx = touch0.x - touch1.x;
		let cy = touch0.y - touch1.y;

		const cMag = Math.hypot(cx, cy);
		cx /= cMag;
		cy /= cMag;

		const sign = (cx * sx + cy * sy) < 0 ? 1 : -1;

		return mean * sign;
	}
}

export class MapCamera extends Camera
{
	private gesture: Gesture;
	private mouse;

	private hWidth = 1;
	private hHeight = 1;
	private zoom: number = 1;

	constructor(canvas: HTMLCanvasElement)
	{
		super(canvas.width, canvas.height);

		this.setSize(canvas.width, canvas.height);

		this.mouse = new Mouse();
		this.gesture = new Gesture(canvas);

		this.forward[0] = 0;
		this.forward[1] = 0;
		this.forward[2] = -1;
	}

	update(dt: number)
	{
		const speed = this.zoom;

		{ // mouse
			if(this.mouse.isPressed(Mouse.LEFT_BUTTON))
			{
				this.position[0] += -this.mouse.velX() * dt * 200 * speed;
				this.position[1] += this.mouse.velY() * dt * 200 * speed;
			}

			this.zoom += this.mouse.scrollVelY() * dt * 20 * speed;
		}

		{ // gesture
			const zoom = -this.gesture.getZoomVel();
			if(zoom != 0)
			{
				this.zoom += zoom * dt * speed;
			}
			else
			{
				this.position[0] += -this.gesture.getVelX() * dt * 200 * speed;
				this.position[1] += this.gesture.getVelY() * dt * 200 * speed;
			}
		}

		this.zoom = Math.min(Math.max(this.zoom, 0.5), 10);
		mat4.ortho(this.projection, -this.hWidth * this.zoom, this.hWidth * this.zoom, -this.hHeight * this.zoom, this.hHeight * this.zoom, 1, 100);
	}

	setSize(width: number, height: number)
	{
		this.option.aspect = width / height;

		this.hWidth = width / 2;
		this.hHeight = height / 2;
	}

	prepareMatrix()
	{
		const fBuffer = new Float32Array(3);

        fBuffer[0] = this.forward[0] + this.position[0];
        fBuffer[1] = this.forward[1] + this.position[1];
        fBuffer[2] = this.forward[2] + this.position[2];

		mat4.lookAt(this.camera, this.position, fBuffer, this.up);
	}
}
