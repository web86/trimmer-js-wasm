const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: false });

// Video src inputs
const elm = document.getElementById("uploader");
const el = document.getElementById("uploadlink");

// wrappers
const inputs = document.getElementById("inputs");
const video_container = document.querySelector(".custom-video-area");
const inputVideoArea = document.getElementById("input-video-area");
const background = document.querySelector(".start");

// info
const message = document.getElementById("message");
const oldDuration = document.querySelector("#oldDuration");
const newDuration = document.querySelector("#newDuration");
const link = document.getElementById("download");
const title = document.querySelector(".title");

// trim btns
const cleaning = document.getElementById("cleaning");
const start_trim = document.getElementById("trim");

// Video
const video = video_container.querySelector("#input-video");
const outputVideo = document.getElementById("output-video");
// Video Controls
const video_controls = video_container.querySelector(".video-controls");
const button_controls = video_container.querySelector(".bottom-wrapper");
const progress_bar = video_container.querySelector(".progress-bar");
const progress = video_container.querySelector(".time-bar");
const buffer_bar = video_container.querySelector(".buffer-bar");
const play_button = video_container.querySelector(".play-button");
const current = video_container.querySelector(".current");
const duration = video_container.querySelector(".duration");

const spinner = (text) => {
  message.innerHTML = `
            <div class="load">
                <div>${text}</div>
                <div class="sk-chase">
                  <div class="sk-chase-dot"></div>
                  <div class="sk-chase-dot"></div>
                  <div class="sk-chase-dot"></div>
                  <div class="sk-chase-dot"></div>
                  <div class="sk-chase-dot"></div>
                  <div class="sk-chase-dot"></div>
                </div>
            </div>`;
};

// Toggles play/pause for the video
function playVideo() {
  if (video.paused) {
    video.play();
    video_controls.classList.add("playing");
  } else {
    video.pause();
    video_controls.classList.remove("playing");
  }
}

function time_format(seconds) {
  var m =
    Math.floor(seconds / 60) < 10
      ? "0" + Math.floor(seconds / 60)
      : Math.floor(seconds / 60);
  var s =
    Math.floor(seconds - m * 60) < 10
      ? "0" + Math.floor(seconds - m * 60)
      : Math.floor(seconds - m * 60);
  return m + ":" + s;
}

function startBuffer() {
  current_buffer = video.buffered.end(0);
  max_duration = video.duration;
  perc = (100 * current_buffer) / max_duration;
  // buffer_bar.css("width", perc + "%");
  buffer_bar.style.width = perc + "%";

  if (current_buffer < max_duration) {
    setTimeout(startBuffer, 500);
  }
}

function updatebar(x) {
  // position = x - progress.offset().left;
  let offsetleft = progress.getBoundingClientRect().left + window.scrollX;
  position = x - offsetleft;

  percentage = (100 * position) / progress_bar.offsetWidth;
  if (percentage > 100) {
    percentage = 100;
  }
  if (percentage < 0) {
    percentage = 0;
  }
  progress.style.width = percentage + "%";
  video.currentTime = (video.duration * percentage) / 100;
}

video.addEventListener("loadedmetadata", function () {
  inputVideoArea.classList.remove("hide");
  message.innerHTML = "Specify where to trim and click the 'Let's trim' button";
  current.textContent = time_format(0);
  duration.textContent = time_format(video.duration);
  // updateVolume(0, 0.7);
  setTimeout(startBuffer, 150);

  progress.style.width = "95%";
  video.currentTime = (video.duration * 95) / 100;
});

// Play/pause on video click
video.addEventListener("click", function () {
  playVideo();
});

// Video duration timer
video.addEventListener("timeupdate", function () {
  current.textContent = time_format(video.currentTime);
  duration.textContent = time_format(video.duration);
  var currentPos = video.currentTime;
  var maxduration = video.duration;
  var perc = (100 * video.currentTime) / video.duration;
  progress.style.width = perc + "%";
});

/* VIDEO CONTROLS
    		------------------------------------------------------- */

// Show button controls on hover
video_container.addEventListener("mouseover", function () {});

// Play/pause on button click
play_button.addEventListener("click", function () {
  playVideo();
});

// VIDEO PROGRESS BAR
//when video timebar clicked
var timeDrag = false; /* check for drag event */
progress_bar.addEventListener("mousedown", function (e) {
  timeDrag = true;
  updatebar(e.pageX);
});
document.addEventListener("mouseup", function (e) {
  if (timeDrag) {
    timeDrag = false;
    updatebar(e.pageX);
  }
});
document.addEventListener("mousemove", function (e) {
  if (timeDrag) {
    updatebar(e.pageX);
  }
});

const checkFile = () => {
  const fileType = elm.files[0].type;
  console.log(fileType);
  if (fileType.indexOf("video") !== -1) {
    trimFile(elm.files[0]);
  } else {
    alert("Oops! This file cannot be processed, upload a video file");
    return;
  }
};

const checkUrl = (e) => {
  e.preventDefault();
  // get the Link
  const weblink = document.getElementById("weblink").value;
  if (
    weblink === "" ||
    (weblink.indexOf(".mp4") === -1 && weblink.indexOf(".mov") === -1)
  ) {
    alert("Error, specify a link to a specific video in mp4 or mov format");
    return;
  }
  trimURL(e, weblink);
};

const trimFile = async (file) => {
  try {
    title.classList.add("hide");
    inputs.classList.add("hide");
    background.classList.remove("start");
    spinner("Downloading tools...");

    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }
    const videofile = await FFmpeg.fetchFile(file);
    // Write it to a file
    await ffmpeg.FS("writeFile", `myfile.mp4`, videofile);
    // Read the file
    // console.log(ffmpeg.FS('readdir', '/'));
    const origData = await ffmpeg.FS("readFile", "myfile.mp4");
    // Get the link and mount it in a hidden video tag in order to get the duration of the video
    video.src = URL.createObjectURL(
      new Blob([origData.buffer], { type: "video/mp4" })
    );
    // inputVideoArea.classList.remove('hide');
  } catch (e) {
    if (e instanceof TypeError) {
      message.innerHTML = "Oops.. This video cannot be processed";
    }
  }
};

const trimURL = async (e, weblink) => {
  inputs.classList.add("hide");
  title.classList.add("hide");
  background.classList.remove("start");

  spinner("Downloading tools...");

  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }
  spinner("Downloading your video...");
  try {
    const videofile = await FFmpeg.fetchFile(weblink);
    await ffmpeg.FS("writeFile", `myfile.mp4`, videofile);
    const origData = await ffmpeg.FS("readFile", "myfile.mp4");
    video.src = URL.createObjectURL(
      new Blob([origData.buffer], { type: "video/mp4" })
    );
  } catch (e) {
    if (e instanceof TypeError) {
      message.innerHTML = "Oops.. It seems the specified link is not working";
    }
  }
};

function cleanup() {
  // clean up
  URL.revokeObjectURL(video.src);
  URL.revokeObjectURL(outputVideo.src);
  location.reload();
}

// Listen to uploading file
elm.addEventListener("change", checkFile);
// Listen to click download & trim
el.addEventListener("click", checkUrl);
// Listen to clean up
cleaning.addEventListener("click", cleanup);
// Listen button to start trimming
start_trim.addEventListener("click", async function () {
  inputVideoArea.classList.add("hide");

  spinner("Starting trimming..");

  let duration = Math.floor(video.currentTime);
  oldDuration.innerText = `Duration before trim: ${Math.floor(
    video.duration
  )} sek`;
  newDuration.innerText = `Duration after trim: ${Math.floor(
    video.currentTime
  )} sek`;

  // cut and copy the result to output.mp4
  await ffmpeg.run(
    "-i",
    "myfile.mp4",
    "-ss",
    "0",
    "-to",
    `${duration}`,
    "-c",
    "copy",
    "output.mp4"
  );

  message.innerHTML = "Trimming is complete!";
  const data = await ffmpeg.FS("readFile", "output.mp4");
  //Create a link for the received video
  outputVideo.src = URL.createObjectURL(
    new Blob([data.buffer], { type: "video/mp4" })
  );
  outputVideo.classList.add("show");
  link.download = "video.mp4"; // Let's set the name of the video file
  link.href = outputVideo.src;
  link.innerText = link.download;
  link.click();
  cleaning.innerHTML = "<button>Clear and trim new video</button>";
  el.value = "";

  ffmpeg.FS("unlink", "myfile.mp4");
  аfmpeg.FS("unlink", "output.mp4");
  // console.log(ffmpeg.FS('readdir', '/'));
});
