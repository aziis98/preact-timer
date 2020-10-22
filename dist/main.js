
import { html, Component, render } from 'https://unpkg.com/htm/preact/standalone.module.js';

class App extends Component {

    constructor() {
        super();

        let lastTimestamps;
        try {
            lastTimestamps = JSON.parse(sessionStorage.getItem('timer.aziis98.com')).map(d => new Date(d));
        } catch (e) {
            lastTimestamps = null;
        }

        let lastSaved;
        try {
            lastSaved = JSON.parse(localStorage.getItem('timer.aziis98.com')).map(d => new Date(d));
        } catch (e) {
            lastSaved = null;
        }

        this.state = {
            saved: lastSaved || [],
            timestamps: lastTimestamps || [],
            timePassed: new Date(0),
        }
    }

    componentDidMount() {
        // Starts the clock updater at 15Hz
        this.timer = setInterval(() => this.updateTimePassed(), 1000 / 15);
    }

    componentWillUnmount() {
        clearInterval(this.timer);
    }

    saveSessionStorage() {
        sessionStorage.setItem("timer.aziis98.com", JSON.stringify(this.state.timestamps));
    }

    saveLocalStorage() {
        localStorage.setItem("timer.aziis98.com", JSON.stringify(this.state.saved));
    }

    isTimerRunning() {
        return this.state.timestamps.length % 2 == 1;
    }

    updateTimePassed() {
        this.setState({
            ...this.state,
            timePassed: this.getPassedTime(),
        });
    }

    toggleTimer() {
        const { timestamps } = this.state;
        this.setState({
            ...this.state,
            timestamps: [...timestamps, new Date()],
        }, () => this.saveSessionStorage());
    }

    saveCurrentTime() {
        const { saved } = this.state;
        this.setState({
            ...this.state,
            saved: [...saved, this.getPassedTime()],
        }, () => this.saveLocalStorage());
    }

    removeSavedItem(index) {
        const { saved } = this.state;
        this.setState({
            ...this.state,
            saved: saved.filter(({}, i) => i != index),
        }, () => this.saveLocalStorage());
    }

    stopTimer() {
        this.setState({
            ...this.state,
            timestamps: [],
        });
    }

    getPassedTime() {
        let timePassed = 0;
        let intervals = this.state.timestamps;

        while (intervals.length) {
            const now = new Date();
            const [from, to = now, ...rest] = intervals;

            timePassed += to.getTime() - from.getTime();
            intervals = rest;
        }

        return new Date(timePassed);
    }

    render(props, state) {
        const time = state.timePassed.getTime();
        const millis = time % 1000;
        const seconds = Math.floor(time / 1000) % 60;
        const minutes = Math.floor(time / (60 * 1000)) % 60;
        const hours = Math.floor(time / (60 * 60 * 1000)) % 60;

        return html`
        <div class="app">
            <div class="flex-h">
                <div class="clock">
                    <span class="hours">
                        ${hours}
                    </span>
                    :
                    <span class="minutes">
                        ${(minutes + '').padStart(2, '0')}
                    </span>
                    :
                    <span class="seconds">
                        ${(seconds + '').padStart(2, '0')}
                    </span>
                    .
                    <span class="millis">
                        ${(millis + '').padEnd(3)}
                    </span>
                </div>
                <div class="flex-h">
                    <button onClick=${()=> this.toggleTimer()}>
                        ${
                            this.isTimerRunning() ? 
                            html`<img src="https://img.icons8.com/ios-filled/50/555555/pause.png"/>` 
                            : 
                            html`<img src="https://img.icons8.com/ios-filled/50/555555/play.png"/>`
                        }
                    </button>
                    <button class="small" onClick=${() => this.stopTimer()}>
                        <img src="https://img.icons8.com/ios-filled/25/555555/stop.png"/>
                    </button>
                    <button class="small" onClick=${() => this.saveCurrentTime()}>
                        <img src="https://img.icons8.com/small/25/555555/save.png"/>
                    </button>
                </div>
            </div>
            <div class="saved-list flex-v">
                ${state.saved.map((item, key) => {
                    const time = item.getTime();
                    const millis = time % 1000;
                    const seconds = Math.floor(time / 1000) % 60;
                    const minutes = Math.floor(time / (60 * 1000)) % 60;
                    const hours = Math.floor(time / (60 * 60 * 1000)) % 60;
                    
                    return html`
                        <div class="save-item">
                            <div class="flex-h">
                                <div class="clock small">
                                    <span class="hours">
                                        ${hours}
                                    </span>
                                    :
                                    <span class="minutes">
                                        ${(minutes + '').padStart(2, '0')}
                                    </span>
                                    :
                                    <span class="seconds">
                                        ${(seconds + '').padStart(2, '0')}
                                    </span>
                                    .
                                    <span class="millis">
                                        ${(millis + '').padEnd(3)}
                                    </span>
                                </div>
                                <button class="small" onClick=${() => this.removeSavedItem(key)}>
                                    <img src="https://img.icons8.com/small/32/555555/delete-forever.png"/>
                                </button>
                            </div>
                        </div>
                    `
                    })
                }
            </div>
        </div>
        <footer style="color: #666">
            <p>
                © aziis98 (Antonio De Lucreziis), Icons by <a href="https://icons8.com">Icons8</a>
            </p>
        </footer>
        `;
    }
}

render(html`<${App} />`, document.body);