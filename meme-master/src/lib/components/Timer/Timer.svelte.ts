export class Timer {
	private history: { 
		start: number;
		// this is the running total of the timer at the time of the event
		// this allows us to not have to look back through the history to find the last start time
		runningTotal: number;
		type: 'start' | 'pause';
	}[] = $state([]);
	private interval = $state<number | undefined>(undefined);
	private internalTimer = $state(0);
	status = $state<'running' | 'paused' | undefined>(undefined);

	time = $derived(this.internalTimer + (this.history.at(-1)?.runningTotal ?? 0));

	constructor() {
		this.internalTimer = 0;
		this.interval = undefined;
	}

	start() {
		this.status = 'running';
		this.interval = window.setInterval(() => {
			this.internalTimer += 1;
		}, 1000);

		const pastTime = this.history.at(-1)?.runningTotal ?? 0;
		this.history.push({ start: Date.now(), type: 'start', runningTotal: pastTime });
		this.internalTimer = 0;
	}

	pause() {
		this.status = 'paused';
		window.clearInterval(this.interval);
		this.interval = undefined;
		const currentTime = Date.now();
		const pastTime =
			Math.floor((currentTime - (this.history.at(-1)?.start ?? currentTime)) / 1000) +
			(this.history.at(-1)?.runningTotal ?? 0);
		this.history.push({ start: currentTime, type: 'pause', runningTotal: pastTime });
		this.internalTimer = 0;
	}

	reset() {
		this.status = undefined;
		this.internalTimer = 0;
		this.history = [];
		window.clearInterval(this.interval);
		this.interval = undefined;
	}
}
