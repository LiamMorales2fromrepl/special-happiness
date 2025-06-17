const preview = document.getElementById('preview');
const recordBtn = document.getElementById('recordBtn');
const musicBtn = document.getElementById('musicBtn');
const speedBtn = document.getElementById('speedBtn');
const bgMusic = document.getElementById('bgMusic');

let mediaRecorder;
let recordedChunks = [];
let currentSpeed = 1;

let stream;
let audioCtx;
let mixedStream;

async function initCamera() {
  stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'user',
      width: { ideal: 360 },
      height: { ideal: 640 }
    },
    audio: true
  });
  preview.srcObject = stream;
}

function mixAudio() {
  audioCtx = new AudioContext();
  const micSource = audioCtx.createMediaStreamSource(stream);
  const musicSource = audioCtx.createMediaElementSource(bgMusic);

  const destination = audioCtx.createMediaStreamDestination();

  micSource.connect(destination);
  musicSource.connect(destination);

  const mixedTracks = [
    ...stream.getVideoTracks(),
    ...destination.stream.getAudioTracks()
  ];

  mixedStream = new MediaStream(mixedTracks);
}

recordBtn.onclick = async () => {
  if (recordBtn.textContent === '🔴 Record') {
    mixAudio();
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(mixedStream);

    mediaRecorder.ondataavailable = (e) => {
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

    mediaRecorder.start();
    bgMusic.play();
    recordBtn.textContent = '⏹ Stop';
  } else {
    mediaRecorder.stop();
    bgMusic.pause();
    bgMusic.currentTime = 0;
    recordBtn.textContent = '🔴 Record';
  }
};

musicBtn.onclick = () => {
  if (bgMusic.paused) {
    bgMusic.play();
    musicBtn.textContent = '🔇 Mute Music';
  } else {
    bgMusic.pause();
    musicBtn.textContent = '🎵 Music';
  }
};

speedBtn.onclick = () => {
  if (currentSpeed === 1) {
    currentSpeed = 0.5;
    speedBtn.textContent = '🐢 0.5x';
  } else if (currentSpeed === 0.5) {
    currentSpeed = 2;
    speedBtn.textContent = '⚡ 2x';
  } else {
    currentSpeed = 1;
    speedBtn.textContent = '⏩ 1x';
  }

  preview.playbackRate = currentSpeed;
};

initCamera();
