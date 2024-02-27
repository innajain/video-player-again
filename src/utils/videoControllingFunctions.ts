function goToNextFrame(video: HTMLVideoElement) {
  if (video.paused) video!.currentTime += 1 / 30;
}

function goToPreviousFrame(video: HTMLVideoElement) {
  if (video.paused) video!.currentTime -= 1 / 30;
}

function increasePlaybackRate(video: HTMLVideoElement) {
  if (video.playbackRate > 3) return;
  video.playbackRate += 0.25;
}

function decreasePlaybackRate(video: HTMLVideoElement) {
  if (video.playbackRate < 0.25) return;
  video.playbackRate -= 0.25;
}

function togglePlayPause(video: HTMLVideoElement) {
  if (!video) return;
  if (video.paused) video.play();
  else video.pause();
}
function seekForward(video: HTMLVideoElement, n: number) {
  if (!video) return;
  if (video.currentTime + n > video.duration)
    video.currentTime = video.duration;
  else video.currentTime += n;
}

function seekBackward(video: HTMLVideoElement, n: number) {
  if (!video) return;
  if (video.currentTime - n < 0) video.currentTime = 0;
  else video.currentTime -= n;
}
