
let mediaRecorder;
let recordedChunks = [];
let stream;
let speed = 1;

const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const speedSelect = document.getElementById('speed');
const preview = document.getElementById('preview');
const playback = document.getElementById('playback');
const download = document.getElementById('download');

speedSelect.addEventListener('change', () => {
  speed = parseFloat(speedSelect.value);
});

startBtn.onclick = async () => {
  stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  preview.srcObject = stream;

  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };
  mediaRecorder.onstop = handleRecordingComplete;

  mediaRecorder.start();
  startBtn.disabled = true;
  stopBtn.disabled = false;
};

stopBtn.onclick = () => {
  mediaRecorder.stop();
  stream.getTracks().forEach(track => track.stop());
  startBtn.disabled = false;
  stopBtn.disabled = true;
};

function handleRecordingComplete() {
  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const recordedUrl = URL.createObjectURL(blob);

  const playbackVideo = document.getElementById('playback');
  playbackVideo.src = recordedUrl;
  playbackVideo.playbackRate = speed;
  playbackVideo.style.display = 'block';
  playbackVideo.onloadedmetadata = () => {
    setTimeout(() => exportWithSpeed(playbackVideo), 100);
  };
}

async function exportWithSpeed(videoElement) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioCtx.createMediaElementSource(videoElement);
  const dest = audioCtx.createMediaStreamDestination();
  source.connect(dest);
  source.connect(audioCtx.destination);

  const canvasStream = canvas.captureStream();
  const mixedStream = new MediaStream([...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);

  const finalRecorder = new MediaRecorder(mixedStream);
  const finalChunks = [];
  finalRecorder.ondataavailable = e => {
    if (e.data.size > 0) finalChunks.push(e.data);
  };
  finalRecorder.onstop = () => {
    const finalBlob = new Blob(finalChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(finalBlob);
    download.href = url;
    download.style.display = 'inline-block';
  };

  videoElement.play();
  finalRecorder.start();

  function drawFrame() {
    if (!videoElement.paused && !videoElement.ended) {
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(drawFrame);
    }
  }
  drawFrame();

  videoElement.onended = () => finalRecorder.stop();
}
