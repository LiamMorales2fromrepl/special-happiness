const preview = document.getElementById('preview');
const playback = document.getElementById('playback');
const audioInput = document.getElementById('audioInput');

const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const stopBtn = document.getElementById('stopBtn');
const speedSelect = document.getElementById('speedSelect');
const downloadLink = document.getElementById('downloadLink');

let cameraStream;
let mediaRecorder;
let recordedChunks = [];

let audioContext;
let audioBuffer;
let audioSource;

let combinedStream;

async function setupCamera() {
  cameraStream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: 360,
      height: 640,
      facingMode: 'user',
      aspectRatio: 9 / 16
    },
    audio: false // We'll add audio from file, not mic
  });
  preview.srcObject = cameraStream;
}

async function loadAudioFile(file) {
  if (!file) return;
  if (!audioContext) audioContext = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
}

function createCombinedStream() {
  const videoTracks = cameraStream.getVideoTracks();
  // Create an audio destination for capturing the audioBuffer playback
  const destination = audioContext.createMediaStreamDestination();

  // Connect audioBuffer playback to the destination node
  if (audioSource) audioSource.disconnect();
  audioSource = audioContext.createBufferSource();
  audioSource.buffer = audioBuffer;
  audioSource.playbackRate.value = parseFloat(speedSelect.value);
  audioSource.connect(destination);
  audioSource.start();

  combinedStream = new MediaStream([...videoTracks, ...destination.stream.getAudioTracks()]);
}

function resetControls() {
  pauseBtn.disabled = true;
  resumeBtn.disabled = true;
  stopBtn.disabled = true;
  startBtn.disabled = false;
  downloadLink.style.display = 'none';
  playback.style.display = 'none';
  playback.src = "";
}

startBtn.onclick = async () => {
  if (!cameraStream) {
    await setupCamera();
  }

  if (audioInput.files.length === 0) {
    alert("Please upload an audio file first.");
    return;
  }

  await loadAudioFile(audioInput.files[0]);

  createCombinedStream();

  recordedChunks = [];
  mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp8,opus' });

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const videoUrl = URL.createObjectURL(blob);
    playback.src = videoUrl;
    playback.style.display = 'block';
    downloadLink.href = videoUrl;
    downloadLink.download = 'recording.webm';
    downloadLink.style.display = 'block';

    resetControls();
  };

  mediaRecorder.start();

  startBtn.disabled = true;
  pauseBtn.disabled = false;
  stopBtn.disabled = false;

  // Automatically stop after 15 seconds
  setTimeout(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      stopBtn.click();
    }
  }, 15000);
};

pauseBtn.onclick = () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.pause();
    if (audioSource) audioSource.stop();
    pauseBtn.disabled = true;
    resumeBtn.disabled = false;
  }
};

resumeBtn.onclick = () => {
  if (mediaRecorder && mediaRecorder.state === 'paused') {
    mediaRecorder.resume();
    if (audioBuffer) {
      // Recreate audio source on resume
      audioSource = audioContext.createBufferSource();
      audioSource.buffer = audioBuffer;
      audioSource.playbackRate.value = parseFloat(speedSelect.value);
      audioSource.connect(audioContext.createMediaStreamDestination());
      audioSource.start();
    }
    pauseBtn.disabled = false;
    resumeBtn.disabled = true;
  }
};

stopBtn.onclick = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  if (audioSource) audioSource.stop();

  pauseBtn.disabled = true;
  resumeBtn.disabled = true;
  stopBtn.disabled = true;
  startBtn.disabled = false;
};

speedSelect.onchange = () => {
  if (audioSource) {
    audioSource.playbackRate.value = parseFloat(speedSelect.value);
  }
};

setupCamera();
resetControls();
