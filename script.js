const video = document.getElementById('preview');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const stopBtn = document.getElementById('stopBtn');
const bgAudio = document.getElementById('bgAudio');
const speedSelect = document.getElementById('speed');

let mediaRecorder;
let recordedChunks = [];
let stream;

async function setupCamera() {
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user' },
    audio: false
  });
  video.srcObject = stream;
}

setupCamera();

startBtn.onclick = () => {
  recordedChunks = [];
  const combinedStream = new MediaStream([
    ...stream.getVideoTracks(),
    ...bgAudio.captureStream().getAudioTracks()
  ]);

  mediaRecorder = new MediaRecorder(combinedStream);

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recording.webm';
    a.click();
  };

  bgAudio.playbackRate = parseFloat(speedSelect.value);
  bgAudio.currentTime = 0;
  bgAudio.play();

  mediaRecorder.start();
  setTimeout(() => {
    stopRecording();
  }, 15000); // 15 seconds max

  pauseBtn.disabled = false;
  stopBtn.disabled = false;
};

pauseBtn.onclick = () => {
  mediaRecorder.pause();
  bgAudio.pause();
  pauseBtn.disabled = true;
  resumeBtn.disabled = false;
};

resumeBtn.onclick = () => {
  mediaRecorder.resume();
  bgAudio.play();
  pauseBtn.disabled = false;
  resumeBtn.disabled = true;
};

stopBtn.onclick = stopRecording;

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  bgAudio.pause();
  bgAudio.currentTime = 0;
  pauseBtn.disabled = true;
  resumeBtn.disabled = true;
  stopBtn.disabled = true;
}