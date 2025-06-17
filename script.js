const preview = document.getElementById('preview');
const playback = document.getElementById('playback');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const stopBtn = document.getElementById('stopBtn');
const bgAudio = document.getElementById('bgAudio');
const speedSelect = document.getElementById('speed');

let mediaRecorder;
let recordedChunks = [];
let cameraStream;
let combinedStream;

aasync function setupCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 360 },
        height: { ideal: 640 },
        facingMode: 'user',
        aspectRatio: 9 / 16
      },
      audio: false
    });
    preview.srcObject = cameraStream;
    console.log('Camera started');
  } catch (err) {
    console.error('Error accessing camera:', err);
    alert('Cannot access camera. Please check permissions and try again.');
  }
}
setupCamera();

function combineStreams() {
  const audioStream = bgAudio.captureStream();
  const videoTracks = cameraStream.getVideoTracks();
  const audioTracks = audioStream.getAudioTracks();

  combinedStream = new MediaStream([...videoTracks, ...audioTracks]);
}

startBtn.onclick = () => {
  recordedChunks = [];

  combineStreams();

  mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm; codecs=vp8,opus' });

  mediaRecorder.ondataavailable = event => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);

  playback.src = url;
  playback.style.display = 'block';
  playback.playbackRate = parseFloat(speedSelect.value);
  playback.play();

  // Trigger download automatically
  const a = document.createElement('a');
  a.href = url;
  a.download = 'recording.webm';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

    playback.src = url;
    playback.style.display = 'block';
    playback.playbackRate = parseFloat(speedSelect.value);
    playback.play();

    // Optional: to download automatically uncomment:
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = 'recording.webm';
    // a.click();
  };

  // Reset bgAudio to start & set speed
  bgAudio.pause();
  bgAudio.currentTime = 0;
  bgAudio.playbackRate = parseFloat(speedSelect.value);

  mediaRecorder.start();
  bgAudio.play();

  pauseBtn.disabled = false;
  stopBtn.disabled = false;
  startBtn.disabled = true;
  resumeBtn.disabled = true;

  // Auto stop after 15s
  setTimeout(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      stopRecording();
    }
  }, 15000);
};

pauseBtn.onclick = () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.pause();
    bgAudio.pause();

    pauseBtn.disabled = true;
    resumeBtn.disabled = false;
  }
};

resumeBtn.onclick = () => {
  if (mediaRecorder && mediaRecorder.state === 'paused') {
    mediaRecorder.resume();
    bgAudio.play();

    pauseBtn.disabled = false;
    resumeBtn.disabled = true;
  }
};

stopBtn.onclick = stopRecording;

speedSelect.onchange = () => {
  // Change bgAudio speed during recording
  if (!mediaRecorder || mediaRecorder.state === 'inactive') {
    // Change playback speed after recording ends
    playback.playbackRate = parseFloat(speedSelect.value);
  } else {
    bgAudio.playbackRate = parseFloat(speedSelect.value);
  }
};

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  bgAudio.pause();
  bgAudio.currentTime = 0;

  pauseBtn.disabled = true;
  resumeBtn.disabled = true;
  stopBtn.disabled = true;
  startBtn.disabled = false;
}
