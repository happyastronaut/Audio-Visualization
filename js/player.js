const canvas = document.getElementById("canvas");
const trackName = document.getElementById('name');
const audio = document.getElementById("audio");
const file = document.getElementById("file-input");
const playBtn = document.getElementById('playBtn');
const playHead = document.getElementById('playHead');
const timeLine = document.getElementById('timeLine');
const time = document.getElementById('time');

let timelineWidth = timeLine.offsetWidth - playHead.offsetWidth;
let onPlayHead = false;
let duration;
let loaded = false;

document.addEventListener("DOMContentLoaded", getWindowSize);
window.addEventListener('resize', getWindowSize);
window.addEventListener('mouseup', mouseUp);
file.addEventListener("change", loadAndRun);
audio.addEventListener("timeupdate", timeUpdate);
audio.addEventListener("canplaythrough", function () {
    duration = audio.duration;
});
playBtn.addEventListener("click", play);
playHead.addEventListener('mousedown', mouseDown);
timeLine.addEventListener("click", function (event) {
    moveplayhead(event);
    audio.currentTime = duration * clickPercent(event);
});


function getWindowSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function loadAndRun() {
    loaded = true;
    const files = this.files;
    console.log('FILES[0]: ', files[0]);
    audio.src = URL.createObjectURL(files[0]);
    trackName.innerText = `${files[0].name}`;
    play();

    const context = new AudioContext();
    const src = context.createMediaElementSource(audio);
    const analyser = context.createAnalyser();

    src.connect(analyser);
    analyser.connect(context.destination);

    // analyser.fftSize = 8192;
    //analyser.fftSize = 16384;
    analyser.fftSize = 32768;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const ctx = canvas.getContext("2d");

    renderFrame();

    function renderFrame() {
        const WIDTH = window.innerWidth;
        const HEIGHT = window.innerHeight;

        requestAnimationFrame(renderFrame);

        //clear canvas
        ctx.fillStyle = "rgba(24,18,30,0.5)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        const center_x = WIDTH / 2;
        const center_y = (HEIGHT / 2) - 50;
        const radius = 60 + dataArray[180] / 5;

        //draw a circle
        ctx.beginPath();
        ctx.arc(center_x, center_y, radius, 0, 2 * Math.PI, false);
        ctx.stroke();

        let r = 0, g = 0, b = 0;
        let bars = 512;

        analyser.getByteFrequencyData(dataArray);

        for (let i = 0; i < bars; i++) {
            if (dataArray[i] > 210) {
                r = 177;
                g = 0;
                b = 222;
            } else if (dataArray[i] > 180) {
                r = 222;
                g = 0;
                b = 70;
            } else if (dataArray[i] > 160) {
                r = 222;
                g = 73;
                b = 0;
            } else if (dataArray[i] > 100) {
                r = 78;
                g = 0;
                b = 255;
            } else {
                r = 52;
                g = 0;
                b = 161;
            }

            const color = `rgb(${r},${g},${b})`;

            const rads = (Math.PI * 2 / bars);

            const bar_height = (dataArray[i] * .7);
            const bar_width = 2;

            const x = center_x + Math.cos(rads * i) * (radius);
            const y = center_y + Math.sin(rads * i) * (radius);
            const x_end = center_x + Math.cos(rads * i) * (radius + bar_height);
            const y_end = center_y + Math.sin(rads * i) * (radius + bar_height);

            //draw bar
            ctx.strokeStyle = color;
            ctx.lineWidth = bar_width;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x_end, y_end);
            ctx.stroke();
        }
    }
}

function clickPercent(event) {
    return (event.clientX - getPosition(timeLine)) / timelineWidth;
}

function mouseDown() {
    onPlayHead = true;
    window.addEventListener('mousemove', moveplayhead);
    audio.removeEventListener('timeupdate', timeUpdate);
}

function mouseUp(event) {
    if (onPlayHead === true) {
        moveplayhead(event);
        window.removeEventListener('mousemove', moveplayhead);
        audio.currentTime = duration * clickPercent(event);
        audio.addEventListener('timeupdate', timeUpdate);
    }
    onPlayHead = false;
}

function moveplayhead(event) {
    let newMarginLeft = event.clientX - getPosition(timeLine);
    if (newMarginLeft >= 0 && newMarginLeft <= timelineWidth) {
        playHead.style.marginLeft = newMarginLeft + "px";
    }
    if (newMarginLeft < 0) {
        playHead.style.marginLeft = "0px";
    }
    if (newMarginLeft > timelineWidth) {
        playHead.style.marginLeft = timelineWidth + "px";
    }
}

function timeUpdate() {
    let playPercent = timelineWidth * (audio.currentTime / duration);
    time.innerText = `${convertTime(Math.round(audio.currentTime))} / ${convertTime(Math.round(duration))}`;
    playHead.style.marginLeft = playPercent + "px";
    if (audio.currentTime === duration) {
        playBtn.className = "";
        playBtn.className = "play";
    }
}

function convertTime(time) {
    let result;
    if (isNaN(time) || time === "" || typeof time !== 'number') return "00:00";

    let hours = parseInt(time / 3600) % 24;
    let minutes = parseInt(time / 60) % 60;
    let seconds = parseInt(time % 60);

    if (hours > 0) {
        result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
    } else {
        result = (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
    }

    return result;
}

function play() {
    if (loaded) {
        if (audio.paused) {
            audio.play();
            playBtn.className = "";
            playBtn.className = "pause";
        } else {
            audio.pause();
            playBtn.className = "";
            playBtn.className = "play";
        }
    }
}

function getPosition(el) {
    return el.getBoundingClientRect().left;
}








