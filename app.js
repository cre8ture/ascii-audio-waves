
const explain = document.querySelector('#explain');
const listenBtn = document.querySelector('#listen');
const searchBtn = document.querySelector('#search');
const contrastBtn = document.querySelector('#contrast');
const container = document.querySelector('#ascii-container');
const input = document.querySelector('#topic');
let chars;
const cols = 100
let soundOn = false;
let hiContrast = false;
let originalPositions


let topic = "machine learning"

async function getWiki(topic) {
    try{
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${topic}`);
    let dataNew = await response.json();
    container.textContent = dataNew.extract;

    }
    catch(err)
    {
        console.error("no network connection or topic not found. Reverting to saved data")
        console.log(data)
        container.textContent = data;

    }
    await transformContainer(container);
    return container.textContent
}

// full text may be too much
// async function getWiki(topic){
//     await clearContainerWithAnimation(container);

//     const response = await fetch(`https://en.wikipedia.org/w/api.php?format=json&action=parse&page=${topic}&origin=*`);
//     const data = await response.json();
//     const parser = new DOMParser();
//     const htmlDocument = parser.parseFromString(data.parse.text["*"], 'text/html');
//     const text = await htmlDocument.body.textContent || '';
//     container.textContent = text;
//     await transformContainer(container);
         
//     // return text;
// }

// initiate page with machine learning
getWiki(topic).then(data => {
    // container.textContent = data;
})

input.addEventListener('change', (e) => {
    topic = e.target.value;
    
})

contrastBtn.addEventListener('click', (e) =>{
    hiContrast = !hiContrast
    contrastBtn.textContent = hiContrast ? "Turn off high contrast" : "Turn on high contrast"
    if(hiContrast)  container.style.color='white'
    else container.style.color='black'
})

searchBtn.addEventListener('click', () => {
    getWiki(topic).then(data => {
        // container.textContent = data;
    }).then(() => {
    })
})

listenBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    listenBtn.textContent =  soundOn ? 'Stop Listening' : 'Listen';
    if(soundOn)
    audioProcessor(soundOn);
    else
    audioOff()
})


function clearContainerWithAnimation(siteContainer) {
    if (siteContainer.hasChildNodes()) {
        let children = Array.from(siteContainer.childNodes);
        let i = 0;

        function removeNextChild() {
            if (i < children.length) {
                let child = children[i];
                child.classList.add('fadeOut');
                child.addEventListener('animationend', () => {
                    siteContainer.removeChild(child);
                    removeNextChild();
                });
                i++;
            }
        }

        removeNextChild();
    }
}

// make spans
async function transformContainer(siteContainer) {
    const text = siteContainer.textContent;
    const textArray = text.split('');

    // Create a temporary container
    let tempContainer = document.createElement('div');

    for (let i = 0; i < textArray.length; i++) {
        let span = document.createElement('span');
        span.innerHTML = textArray[i] === ' ' ? '&nbsp;' : textArray[i];
        tempContainer.appendChild(span);

        if (i != 0 && i != textArray.length-1 && i % cols === 0) {
            let br = document.createElement('br');
            tempContainer.append(br);
        }
    }

    // Replace the content of siteContainer with the content of tempContainer
    siteContainer.innerHTML = tempContainer.innerHTML;
    chars = Array.from(document.getElementsByTagName('span'));
    if(chars){
        console.log(chars);
        originalPositions = chars.map(char => char.getBoundingClientRect());
        console.log("originalPositions", originalPositions);
    }
    // Store the original positions
chars.forEach(char => {
    let computedStyle = getComputedStyle(char);
    char.dataset.originalLeft = computedStyle.left;
    char.dataset.originalTop = computedStyle.top;
});
}

async function transformContainer_chunk(siteContainer, x, y, width, height) {
    const text = siteContainer.textContent;
    const textArray = text.split('');

    // Calculate the start and end indices of the chunk
    let start = y * cols + x;
    let end = start + width + (height - 1) * cols;

    // Create a temporary container
    let tempContainer = document.createElement('div');

    for (let i = 0; i < textArray.length; i++) {
        if (i >= start && i < end && (i - start) % cols < width) {
            // This character is inside the chunk, so create a span for it
            let span = document.createElement('span');
            span.innerHTML = textArray[i] === ' ' ? '&nbsp;' : textArray[i];
            tempContainer.appendChild(span);
        } else {
            // This character is outside the chunk, so just add it as text
            tempContainer.appendChild(document.createTextNode(textArray[i]));
        }

        if (i % cols === 0) {
            let br = document.createElement('br');
            tempContainer.append(br);
        }
    }

    // Replace the content of siteContainer with the content of tempContainer
    siteContainer.innerHTML = tempContainer.innerHTML;
    siteContainer.style.position = 'relative'
}
let audioContext;
let analyzer;
let dataArray;
let source
let animationFrameId;

function audioProcessor(on) {
    let stream;
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(function(mediaStream) {
            stream = mediaStream;
            // Now you can use `stream` in your audio processing code
            // Create audio context
            audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create an analyzer
            analyzer = audioContext.createAnalyser();
            analyzer.fftSize = 2048; // Change this to change the amount of data you get

            // Create a buffer to store the data
            let bufferLength = analyzer.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);

            // Connect the source to the analyzer and the analyzer to the destination.
             source = audioContext.createMediaStreamSource(stream);
            source.connect(analyzer);

            // Start the animation loop
            runAnimation();
        });
}

function runAnimation() {
    // Use requestAnimationFrame to create a loop
    animationFrameId = requestAnimationFrame(runAnimation);

    // Get the data from the analyzer
    analyzer.getByteTimeDomainData(dataArray);

    // console.log(dataArray)

    mapAudioToText()
    // Now dataArray contains the current audio data
    // You can process it here...
}

function audioOff(){
    if(source)
    {
        source.disconnect(analyzer)
    }

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    // Revert the style changes
    chars.forEach(char => {
        char.style.transition = 'all 2s ease-in-out';
        console.log("me char", char)
        char.style.position = 'static';
        // char.style.left = char.dataset.originalLeft;
        // char.style.top = char.dataset.originalTop;
        char.style.color = 'black'
        char.style.backgroundColor = 'BlanchedAlmond'; //container.style.backgroundColor;
    });
}

function maxAndMin(){
    return [Math.max(...dataArray), Math.min(...dataArray)]
}




function mapAudioToText(){
    let ratio = dataArray.length / chars.length

    let [maxVal, minVal] =  maxAndMin()
    const midVal = Math.floor((maxVal-minVal)/2) + minVal
    const range = maxVal - minVal


    // iterate through to augment the text
    for (i = 0; i < chars.length; i++){
        chars[i].style.transition = '';

        const dataIndex = Math.floor(i *ratio)

        const fontSize  = dataArray[dataIndex]/ 255 * 40;
        // const colorGrad  = dataArray[dataIndex] /// 255 * 255;

        // const color = 'rgb(' + colorGrad + ', 0, ' + (255 - colorGrad) + ')'
        let color; 
        if(!hiContrast){
         color = 'rgb(' + dataArray[dataIndex] + ', 0, ' + (255 -dataArray[dataIndex]) + ')'
        }
        else{
         color = (dataArray[dataIndex] - minVal) / (range) * 255;
        }

        // const posX = (dataArray[dataIndex]) / (midVal) * chars[i].getBoundingClientRect().left
        // const posY = (dataArray[dataIndex]) / (midVal) * chars[i].getBoundingClientRect().top
// Get the original position of the character
// Before you start moving the elements, store their original positions

// Then, in your repeating function:
// Calculate the offset based on the dataArray value
const offsetX = (dataArray[dataIndex] / 255 * window.innerWidth * 0.1);
const offsetY = (dataArray[dataIndex] / 255 * window.innerHeight * 0.1);

// Get the original position of the character
let originalPos = originalPositions[i];

// Calculate the new position based on the original position and the offset
const posX = originalPos.left + offsetX;
const posY = originalPos.top + offsetY;

// console.log("maxVal, minVal, range", maxVal, minVal, maxVal-minVal)

chars[i].style.fontSize = fontSize + 'px'
chars[i].style.backgroundColor = color

// Change the position of the span
chars[i].style.position = 'absolute';
chars[i].style.left = posX + 'px';
chars[i].style.top = posY + 'px';

    }
}




// ------------------------------------------------------


// // Get the ASCII container element from the document
// const container = document.getElementById("asciiContainer");
// const time = document.getElementById("time");
// const fps = document.getElementById("fps");
// const frameCount = document.getElementById("frame");

// let worker = new Worker('worker.js');


// let lastTime = performance.now();
// let initialTime = performance.now();


// // Set the number of rows and columns for the ASCII grid
// const rows = 80;
// const cols = 80;

// // Loop to initialize the ASCII grid with spans and line breaks
// for (let y = 0; y < rows; y++) {
//   for (let x = 0; x < cols; x++) {
//     // Create a new span element for each ASCII character
//     const span = document.createElement("span");
//     // Append the span to the container
//     container.appendChild(span);
//   }
//   // After each row, append a line break to start a new line
//   container.appendChild(document.createElement("br"));
// }

// // Select all span elements in the container (representing each ASCII character)
// const chars = container.querySelectorAll("span");

// // Initialize a frame counter for animation
// let frame = 0;

// const density = "█▓▒░ ".split('')

// // import { fract } from "/src/modules/num.js"

 function main(coord, context, cursor, buffer){
	const t = context.time 
	const x = coord.x
	const y = coord.y
	//const index = coord.index
	//const o = Math.sin(y * Math.sin(t) * 0.2 + x * 0.04 + t) * 20
	//const i = Math.round(Math.abs(x + y + o)) % chars.length
	const v0 = context.cols / 4 + wave(t, y, [0.15, 0.13, 0.37], [10,8,5]) * 0.9;
	const v1 = v0 + wave(t, y, [0.12, 0.14, 0.27], [3,6,5]) * 0.8;
	const v2 = v1 + wave(t, y, [0.089, 0.023, 0.217], [2,4,2]) * 0.3;
	const v3 = v2 + wave(t, y, [0.167, 0.054, 0.147], [4,6,7]) * 0.4;
	const i = x > v3 ? 4
		: x > v2 ? 3
		: x > v1 ? 2
		: x > v0 ? 1
		: 0;

	return density[i];
}

function wave(t, y, seeds, amps) {
	return (
		(Math.sin(t + y * seeds[0]) + 1) * amps[0]
		+ (Math.sin(t + y * seeds[1]) + 1) * amps[1]
		+ (Math.sin(t + y * seeds[2])) * amps[2]
	)
}

// // let waveCache = {};

// // function wave(t, y, seeds, amps) {
// //   // Create a unique key for this set of parameters
// //   let key = `${t}-${y}-${seeds.join(',')}-${amps.join(',')}`;

// //   // If the result is in the cache, return it
// //   if (waveCache[key] !== undefined) {
// //     return waveCache[key];
// //   }

// //   // Otherwise, calculate the result
// //   let result = (
// //     (Math.sin(t + y * seeds[0]) + 1) * amps[0]
// //     + (Math.sin(t + y * seeds[1]) + 1) * amps[1]
// //     + (Math.sin(t + y * seeds[2])) * amps[2]
// //   );

// //   // Store the result in the cache
// //   waveCache[key] = result;

// //   // Return the result
// //   return result;
// // }


// let context = {}
// let cursor = {}
// let buffer = {}
// // Function to update each frame of the animation
// let lastUpdate = 0;
// function updateFrame() {
//   let now = Date.now();
//   if (now - lastUpdate < 1000 / 60) { // 60 FPS
//     requestAnimationFrame(updateFrame);
//     return; // this smooths it out and throttle updates to 60 FPS
//   }
//   lastUpdate = now;
//   let startTime = performance.now();
//   // Update context
//   context.time = Date.now() / 1000; // Current time in seconds
//   context.cols = 80; // Number of columns in your ASCII grid

//  // Listen for messages from the worker
// worker.onmessage = function(event) {
//   // Update the corresponding span element in the container
//   let { char, x, y } = event.data;
//   console.log("char", char)
//   chars[y * cols + x].textContent = char;
// };

// // Loop over grid coordinates
// for (let y = 0; y < rows; y++) {
//   for (let x = 0; x < cols; x++) {
//     // Create coord object
//     let coord = {x: x, y: y};

//     // Send data to the worker
//     worker.postMessage({ coord, context });
//   }
// }

  
//   const endTime = performance.now();
//   const executionTime = endTime - initialTime;
//   time.textContent = `Execution time: ${Math.floor(executionTime)} ms`;

//   const frameTime = startTime - lastTime;
//   // const fps = 1000 / frameTime;
//   let fpsCalc = frameTime ? 1000 / frameTime : 0;
//   fps.textContent = `FPS: ${Math.floor(fpsCalc)}`
//   frameCount.textContent = `Frame: ${frame}`;
//   lastTime = startTime;
//   // Increment the frame counter
//   frame++;
//   // Request the next frame of the animation
//   requestAnimationFrame(updateFrame);
// }

// // Start the animation
// updateFrame();
