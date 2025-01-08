class UITools {
	static cleanQuery(selector: string) {
		const e = document.querySelector(selector);
		e.innerHTML = '';
		return e;
	}

	static create(tagName: string, options = {} as any) {
		const e = document.createElement(tagName);

		if (options.class) {
			if (typeof options.class == 'string') e.classList.add(options.class);
			else for (const c of options.class) e.classList.add(c);
			delete options.class;
		}

		if (options.text) {
			e.textContent = options.text;
			delete options.text;
		}

		for (const [key, value] of Object.entries(options) as any) e.setAttribute(key, value);

		return e;
	}
}

export class UI {
	private body: HTMLElement;

	constructor() {
		this.body = document.body;
	}

	showConnectionMenu(onEnter: (name: string) => void) {
		const div = UITools.create('div');

		const title = UITools.create('h1', {text: 'Entrez votre nom :'});
		const input = UITools.create('input', {type: 'text', min: 3, max: 32}) as HTMLInputElement;
		const button = UITools.create('button', {text: 'Entrer'});

		const name = localStorage.getItem('name');
		if(name && typeof name === 'string')
		{
			input.value = name;
		}

		div.append(title);
		div.append(input);
		div.append(button);

		button.addEventListener('click', () => {
			const name = input.value.trim();

			localStorage.setItem('name', name);
			onEnter(name);
			
			this.body.removeChild(div);
		});

		this.body.append(div);
	}
}
