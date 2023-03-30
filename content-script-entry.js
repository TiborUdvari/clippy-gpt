// todo - rename classes and things to make sure there are no conflicts
// todo - remove unneccessary libs, etc. especially from being copied
// todo - add the tick, and correct font
// todo - add a link to open chatgpt in a new tab at the end to actually work with it
// todo - keys to make it work faster with enter

import { base64, clippyData } from "./map.mjs";

const ccontainer = `
    <div class="cContainer" id="cContainer">
      <div class="cResizable" id="cResizable">
        <div class="response" id="clippygptResponse">Let's get started, ask me something</div>
        <div class="chatArea">
          <textarea></textarea>
          <button>Clippy GPT 📎</button>
        </div>
      </div>
      <div class="cClippy">
        <div class="clippy" id="clippy"></div>
      </div>
    </div>
  `;

document.body.innerHTML += ccontainer;

var existingClippy = document.querySelector(".clippy");
var clippyEl = undefined;
if (existingClippy) {
  console.log("clippy already exists");
  clippyEl = existingClippy;
} else {
  console.log("clippy does not exist");
  var clippyEl = document.createElement("div");
  clippyEl.className = "clippy";
  document.body.appendChild(clippyEl);
}

clippyEl.style.backgroundImage = "url(" + base64 + ")";
clippyEl.style.backgroundPositionX = "-248px";
clippyEl.style.backgroundPositionY = "-3069px";

var currentFrames = clippyData.animations.IdleRopePile.frames;

let lastFrameTime = 0;
let currentFrame = 0;
let animationQueue = [];
let idleAnimations = ["IdleRopePile", "IdleAtom", "Idle1_1", "IdleSideToSide", "IdleHeadScratch", "IdleFingerTap", "IdleSnooze", "IdleEyeBrowRaise"];
let activeAnimations = Object.keys(clippyData.animations).filter((a) => !idleAnimations.includes(a));

function animate(currentTime) {
  const frameData = currentFrames[currentFrame] ?? {};

  const elapsedTime = currentTime - lastFrameTime;

  if (elapsedTime >= frameData.duration) {
    if (frameData.sound) {
      // playSound(frameData.sound);
    }
    if (frameData.images) {
      clippyEl.style.backgroundPositionX = "-" + frameData.images[0][0] + "px";
      clippyEl.style.backgroundPositionY = "-" + frameData.images[0][1] + "px";
    }

    lastFrameTime = currentTime;
    currentFrame = (currentFrame + 1) % currentFrames.length;

    if (currentFrame === 0) {
      
      if (animationQueue.length > 0) {
        console.log("NEXT ANIMATION");
        console.log(animationQueue)
        let nextAnimName = animationQueue.shift();
        currentFrames = clippyData.animations[nextAnimName].frames
        console.log(animationQueue);
      } else {
        const randomAnimationName = idleAnimations[Math.floor(Math.random() * idleAnimations.length)];
        currentFrames = clippyData.animations[randomAnimationName].frames;
      }
    }
  }

  requestAnimationFrame(animate);
}

let currentAnim = requestAnimationFrame(animate);

const container = document.getElementById("cContainer");
const clippy = document.getElementById("clippy");

clippy.addEventListener("mousedown", mouseDown);

let offsetX, offsetY;
let isDragging = false;

function mouseDown(e) {
  e.preventDefault();
  offsetX = e.clientX - container.getBoundingClientRect().left;
  offsetY = e.clientY - container.getBoundingClientRect().top;
  document.addEventListener("mousemove", mouseMove);
  document.addEventListener("mouseup", mouseUp);
}

function mouseMove(e) {
  isDragging = true;
  container.style.left = e.clientX - offsetX + "px";
  container.style.top = e.clientY - offsetY + "px";
}

function mouseUp() {
  document.removeEventListener("mousemove", mouseMove);
  document.removeEventListener("mouseup", mouseUp);

  setTimeout(() => {
    isDragging = false;
  }, 0);
}

// Show/Hide functionality
const cResizable = document.getElementById("cResizable");

clippy.addEventListener("click", toggleResizable);

function toggleResizable() {
  if (!isDragging) {
    if (cResizable.style.visibility === "hidden") {
      cResizable.style.visibility = "visible";
    } else {
      cResizable.style.visibility = "hidden";
    }
  }
}

const chatButton = document.querySelector(".chatArea button");
const chatTextarea = document.querySelector(".chatArea textarea");

chatTextarea.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    chatButton.click();
  }
});

chatButton.addEventListener("click", () => {
  const question = chatTextarea.value;
  if (question) {
    const randomAnimationName = activeAnimations[Math.floor(Math.random() * activeAnimations.length)];
    // animationQueue.push(randomAnimationName);

    console.log("clippy anim " + randomAnimationName);
    currentFrames = clippyData.animations[randomAnimationName].frames;
    lastFrameTime = 0;
    currentFrame = 0;
    cancelAnimationFrame(currentAnim);
    currentAnim = requestAnimationFrame(animate);

    run(question);
  } else {
    alert("Please enter a question in the textarea.");
  }
});

async function run(question) {
  question = "Act as Clippy, the beloved microsoft assistant. Your request is: " + question;
  const container = document.getElementById("clippygptResponse");
  container.innerHTML =
    '<p class="loading">Waiting for ClippyGPT response...</p>';

  const port = chrome.runtime.connect();
  port.onMessage.addListener(function (msg) {
    if (msg.answer) {
      container.innerHTML = `<p>${msg.answer}</p><p>Continue <a href="https://chat.openai.com" target="_blank">chat</a></p>`;
    } else if (msg.error === "UNAUTHORIZED") {
      container.innerHTML =
        '<p>Please login at <a href="https://chat.openai.com" target="_blank">chat.openai.com</a> first</p>';
    } else {
      container.innerHTML = "<p>Failed to load response from ChatGPT</p>";
    }
  });
  port.postMessage({ question });
}
