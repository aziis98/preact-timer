import { 
    html, 
    Component, 
    render,
    useState,
    useEffect,
    useCallback
} from 'https://unpkg.com/htm/preact/standalone.module.js'

const STORAGE_NAMESPACE_VERSIONS = [
    {
        // State :: [Duration]
        name: 'aziis98/timer@1',
        initial: [],
    },
    {
        // State :: [{ date: Date, duration: Duration }]
        name: 'aziis98/timer@2',
        initial: [],
        migrate: previousState => {
            return previousState.map(duration => ({
                date: new Date(),
                duration, 
            }))
        }
    }
].reverse()

// The storage namespace is the most recent version
const STORAGE_NAMESPACE = STORAGE_NAMESPACE_VERSIONS[0].name

const prefetch = [
    'https://img.icons8.com/ios-filled/100/555555/pause.png',
    'https://img.icons8.com/ios-filled/100/555555/play.png',
    'https://img.icons8.com/ios-filled/25/555555/stop.png',
    'https://img.icons8.com/small/25/555555/save.png',
    'https://img.icons8.com/small/32/555555/delete-forever.png',
].map(imageSrc => new Image().src = imageSrc)

const loadStorage = (version = 0) => {
    if (version >= STORAGE_NAMESPACE_VERSIONS.length) {
        return null;
    }

    console.log(`Loading from version: ${STORAGE_NAMESPACE_VERSIONS[version].name}`)
    
    const stateVersion = STORAGE_NAMESPACE_VERSIONS[version]
    
    let state
    try {
        state = JSON.parse(localStorage.getItem(stateVersion.name))
        return state
    } catch (e) {
        state = loadStorage(version + 1)

        if (state) {
            console.log(`Applying migration to version: ${STORAGE_NAMESPACE_VERSIONS[version].name}`)
            return stateVersion.migrate(state)
        }
        else {
            return STORAGE_NAMESPACE_VERSIONS[version].initial
        }
    }
}

const useLocalStorage = (object) => {
    useEffect(() => {
        localStorage.setItem(STORAGE_NAMESPACE, JSON.stringify(object))
    }, [ object ])
}

const useTimer = () => {
    let initial
    try {
        initial = JSON.parse(sessionStorage.getItem('aziis98/timer'))
            .map(d => new Date(d))
    } catch (e) {
        initial = []
    }

    const [timestamps, setTimestamps] = useState(initial)

    useEffect(() => {
        sessionStorage.setItem('aziis98/timer', JSON.stringify(timestamps))
    }, [ timestamps ])

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

const saveListInitialState = loadStorage().map(o => ({
    date: new Date(o.date),
    duration: new Date(o.duration),
}))

const useSaveList = () => {
    const [savedList, setSavedList] = useState(saveListInitialState)
    useLocalStorage(savedList)

    const add = duration => {
        setSavedList(
            [
                ...savedList, 
                { 
                    date: new Date(), 
                    duration 
                }
            ]
        )
    }

    const remove = index => {
        setSavedList(savedList.filter(({}, i) => i != index))
    }

    return [
        html`
            <div class="saved-list flex-v">
                ${savedList.map((item, index) => {

                    const dateString = ''
                        + (item.date.getDate() + '').padStart(2, '0')
                        + '/'
                        + (item.date.getMonth() + 1 + '').padStart(2, '0')
                        + '/'
                        + item.date.getFullYear()

                    return html`
                        <div class="save-item">
                            <div class="flex-h">
                                <div class="date">
                                    ${dateString}
                                </div>
                                <div class="clock small">
                                    <${TimeFace} datetime=${item.duration} />
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

const projectTime = datetime => {
    const time = datetime.getTime()
    const hours = Math.floor(time / (60 * 60 * 1000)) % 60
    const minutes = Math.floor(time / (60 * 1000)) % 60
    const seconds = Math.floor(time / 1000) % 60
    const millis = time % 1000

    return [hours, minutes, seconds, millis]
}

const TimeFace = ({ datetime }) => {
    const [hours, minutes, seconds, millis] = projectTime(datetime)

    return html`
        <span class="hours">
            ${hours}
        </span>
        <div class="colon">:</div>
        <span class="minutes">
            ${(minutes + '').padStart(2, '0')}
        </span>
        <div class="colon">:</div>
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
        const datetime = getTimerCurrentValue()

        if (isTimerRunning()) {
            const [hours, minutes, seconds, millis] = projectTime(datetime)

            document.title = ''
                + hours
                + ':'
                + (minutes + '').padStart(2, '0')
                + ':'
                + (seconds + '').padStart(2, '0')
                + '.'
                + (millis + '').padEnd(3, '0')
        } else {
            document.title = 'Timer'
        }

        setTimePassed(datetime)
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