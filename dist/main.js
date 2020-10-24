import { 
    html, 
    Component, 
    render,
    useState,
    useEffect,
    useCallback
} from 'https://unpkg.com/htm/preact/standalone.module.js'

const STORAGE_NAMESPACE = 'aziis98/timer@1';

const prefetch = [
    'https://img.icons8.com/ios-filled/100/555555/pause.png',
    'https://img.icons8.com/ios-filled/100/555555/play.png',
    'https://img.icons8.com/ios-filled/25/555555/stop.png',
    'https://img.icons8.com/small/25/555555/save.png',
    'https://img.icons8.com/small/32/555555/delete-forever.png',
].map(imageSrc => new Image().src = imageSrc)

const loadStorage = (storage, initial = null) => {
    try {
        return JSON.parse(storage.getItem(STORAGE_NAMESPACE)) || initial
    } catch (e) {
        return initial
    }
}

const useStorageState = (storage, object) => {
    useEffect(() => {
        storage.setItem(STORAGE_NAMESPACE, JSON.stringify(object))
    }, [ object ])
}

const useTimer = () => {
    const initial = loadStorage(sessionStorage, []).map(d => new Date(d))
    const [timestamps, setTimestamps] = useState(initial)
    useStorageState(sessionStorage, timestamps)

    const toggle = () => {
        setTimestamps([...timestamps, new Date()])
    }

    const reset = () => {
        setTimestamps([])
    }

    const isRunning = () => {
        return timestamps.length % 2 === 1
    }

    const getCurrentValue = useCallback(() => {
        let timePassed = 0
        let intervals = timestamps

        while (intervals.length) {
            const now = new Date()
            const [from, to = now, ...rest] = intervals

            timePassed += to.getTime() - from.getTime()
            intervals = rest
        }

        return new Date(timePassed)
    })

    return [toggle, reset, isRunning, getCurrentValue]
}

const useSaveList = () => {
    const initial = loadStorage(localStorage, []).map(d => new Date(d))
    const [savedList, setSavedList] = useState(initial)
    useStorageState(localStorage, savedList)

    const add = datetime => {
        setSavedList(
            [...savedList, datetime]
        )
    }

    const remove = index => {
        setSavedList(savedList.filter(({}, i) => i != index))
    }

    return [
        html`
            <div class="saved-list flex-v">
                ${savedList.map((item, index) => {
                    return html`
                        <div class="save-item">
                            <div class="flex-h">
                                <div class="clock small">
                                    <${TimeFace} datetime=${item} />
                                </div>
                                <button class="small" onClick=${() => remove(index)}>
                                    <img src="https://img.icons8.com/small/32/555555/delete-forever.png"/>
                                </button>
                            </div>
                        </div>
                    `
                    })
                }
            </div>
        `,
        add, remove
    ]
}

const TimeFace = ({ datetime }) => {
    const time = datetime.getTime()
    const millis = time % 1000
    const seconds = Math.floor(time / 1000) % 60
    const minutes = Math.floor(time / (60 * 1000)) % 60
    const hours = Math.floor(time / (60 * 60 * 1000)) % 60

    return html`
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
            ${(millis + '').padEnd(3, '0')}
        </span>
    `
}

const App = () => {
    
    const [timePassed, setTimePassed] = useState(new Date(0))
    const [toggleTimer, resetTimer, isTimerRunning, getTimerCurrentValue] = useTimer()
    const [SaveList, addSaved] = useSaveList()

    const updateTimePassed = useCallback(() => {
        setTimePassed(getTimerCurrentValue())
    })
    
    useEffect(() => {
        const timer = setInterval(updateTimePassed, 1000 / 15)
        return () => {
            clearInterval(timer)
        }
    })

    return html`
    <div class="app">
        <div class="watchface flex-h">
            <div class="clock">
                <${TimeFace} datetime=${timePassed} />
            </div>
            <div class="flex-h">
                <button onClick=${toggleTimer}>
                    ${
                        isTimerRunning() ? 
                        html`<img src="https://img.icons8.com/ios-filled/100/555555/pause.png"/>`
                        : 
                        html`<img src="https://img.icons8.com/ios-filled/100/555555/play.png"/>`
                    }
                </button>
                <button class="small" onClick=${resetTimer}>
                    <img src="https://img.icons8.com/ios-filled/50/555555/stop.png"/>
                </button>
                <button class="small" onClick=${() => addSaved(timePassed)}>
                    <img src="https://img.icons8.com/small/50/555555/save.png"/>
                </button>
            </div>
        </div>
        ${SaveList}
    </div>
    <footer style="color: #666">
        <p>
            © aziis98 (Antonio De Lucreziis), Icons by <a href="https://icons8.com">Icons8</a>
        </p>
    </footer>
    `
}

render(html`<${App} />`, document.body)