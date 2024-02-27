import { useEffect, useRef, useState } from "react";
import ControlsSection from "./ControlsSection";

function App() {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [video, setVideo] = useState<HTMLVideoElement>();
  const [speed, setSpeed] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [isfullScreen, setIsFullScreen] = useState(false);
  const keyHoldUtils = useRef({
    seekInterval: null as NodeJS.Timeout | null,
    holdPromise: null as Promise<void> | null,
    isHoldPromiseResolved: false,
    holdPromiseTimeout: null as NodeJS.Timeout | null,
    savedSpeed: null as number | null,
    savedPlayPauseState: null as "play" | "pause" | null,
  }).current;
  const [videoFile, setVideoFile] = useState<string>();

  useEffect(() => {
    if (videoRef.current) {
      setVideo(videoRef.current);
    }
    if (!video) {
      return;
    }
    function goToNextFrame() {
      if (!video) return;
      if (video.paused) video.currentTime += 1 / 30;
    }

    function goToPreviousFrame() {
      if (!video) return;

      if (video.paused) video.currentTime -= 1 / 30;
    }

    function increasePlaybackRate() {
      if (!video) return;

      if (video.playbackRate >= 3) return;
      video.playbackRate += 0.25;
    }

    function decreasePlaybackRate() {
      if (!video) return;

      if (video.playbackRate <= 0.25) return;
      video.playbackRate -= 0.25;
    }

    function togglePlayPause() {
      if (!video) return;

      if (video.paused) video.play();
      else video.pause();
    }

    function seekForward(n: number) {
      if (!video) return;

      if (video.currentTime + n > video.duration)
        video.currentTime = video.duration;
      else video.currentTime += n;
    }

    function seekBackward(n: number) {
      if (!video) return;
      if (video.currentTime - n < 0) video.currentTime = 0;
      else video.currentTime -= n;
    }

    function changeCurrentTimeByPercentage(n: number) {
      if (!video) return;
      const newTime = (n / 10) * video.duration;
      video.currentTime = newTime;
    }
    function toggleFullscreen() {
      if (!videoContainerRef.current) return;
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setIsFullScreen(false);
        setShowControls(false);
      } else {
        videoContainerRef.current.requestFullscreen();
        setIsFullScreen(true);
      }
    }

    function startSmoothSeekingForward() {
      if (!video) return;
      keyHoldUtils.seekInterval = setInterval(() => seekForward(30), 500);
    }

    function startSmoothSeekingBackward() {
      if (!video) return;
      keyHoldUtils.seekInterval = setInterval(() => seekBackward(20), 500);
    }

    function stopSmoothSeeking() {
      if (!keyHoldUtils.seekInterval) return;
      clearInterval(keyHoldUtils.seekInterval);
      keyHoldUtils.seekInterval = null;
    }

    function getHoldPromise(timeout = 500) {
      return new Promise<void>((resolve) => {
        keyHoldUtils.holdPromiseTimeout = setTimeout(() => {
          resolve();
          keyHoldUtils.isHoldPromiseResolved = true;
        }, timeout);
      });
    }

    function captureHold(duringHoldFunc: () => void) {
      if (!keyHoldUtils.holdPromise) {
        keyHoldUtils.holdPromise = getHoldPromise();
        keyHoldUtils.holdPromise.then(() => {
          duringHoldFunc();
        });
      }
    }

    function tempSpeed2x() {
      if (!video) return;
      keyHoldUtils.savedSpeed = video.playbackRate;

      video.playbackRate = 2;
      keyHoldUtils.savedPlayPauseState = video.paused ? "pause" : "play";
      if (video.paused) video.play();
    }

    function doomOfHold(afterHoldFunc: () => void, noHoldFunc: () => void) {
      if (!keyHoldUtils.isHoldPromiseResolved) {
        noHoldFunc();
        clearTimeout(keyHoldUtils.holdPromiseTimeout!);
      } else {
        afterHoldFunc();
        clearInterval(keyHoldUtils.seekInterval!);
      }

      keyHoldUtils.holdPromise = null;
      keyHoldUtils.holdPromiseTimeout = null;
      keyHoldUtils.seekInterval = null;
      keyHoldUtils.isHoldPromiseResolved = false;
    }

    function revertSpeed() {
      if (!video) return;

      video.playbackRate = keyHoldUtils.savedSpeed!;
      if (keyHoldUtils.savedPlayPauseState === "play") video.play();
      else video.pause();
    }

    function updateSpeedState() {
      setSpeed(video!.playbackRate);
    }

    let mouseMoveTimeoutPromise: Promise<void> | null = null;
    let mouseMoveTimeoutPromiseResolved = true;
    let mouseMoveTimeOutPromiseTimeout: NodeJS.Timeout | null = null;

    function showControlsBasedOnMouseMove() {
      if (!isfullScreen) return;
      if (!mouseMoveTimeoutPromiseResolved) {
        clearTimeout(mouseMoveTimeOutPromiseTimeout!);
        mouseMoveTimeoutPromiseResolved = true;
      }
      setShowControls(true);
      mouseMoveTimeoutPromise = new Promise<void>((resolve) => {
        mouseMoveTimeOutPromiseTimeout = setTimeout(() => {
          setShowControls(false);
          resolve();
        }, 2000);
      });
      mouseMoveTimeoutPromiseResolved = false;
      mouseMoveTimeoutPromise.then(() => {
        mouseMoveTimeoutPromiseResolved = true;
      });
    }

    function handleKeydown(e: KeyboardEvent) {
      if (!video) return;
      if (e.key === " ") {
        captureHold(tempSpeed2x);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "ArrowRight" && !e.ctrlKey) {
        captureHold(startSmoothSeekingForward);
      } else if (e.key === "ArrowLeft" && !e.ctrlKey) {
        captureHold(startSmoothSeekingBackward);
      } else if (e.key === "ArrowRight" && e.ctrlKey) {
        seekForward(60);
      } else if (e.key === "ArrowLeft" && e.ctrlKey) {
        seekBackward(60);
      } else if ("0123456789".includes(e.key)) {
        changeCurrentTimeByPercentage(+e.key);
      } else if (e.key === ".") {
        goToNextFrame();
      } else if (e.key === ",") {
        goToPreviousFrame();
      } else if (e.key === "+") {
        increasePlaybackRate();
      } else if (e.key === "-") {
        decreasePlaybackRate();
      }
    }

    function handleKeyup(e: KeyboardEvent) {
      if (!video) return;
      if (e.key === " ") {
        doomOfHold(revertSpeed, () => togglePlayPause());
      } else if (e.key === "ArrowRight" && !e.ctrlKey) {
        doomOfHold(stopSmoothSeeking, () => seekForward(5));
      } else if (e.key === "ArrowLeft" && !e.ctrlKey) {
        doomOfHold(stopSmoothSeeking, () => seekBackward(5));
      }
    }

    video.addEventListener("click", togglePlayPause);
    video.addEventListener("dblclick", toggleFullscreen);
    video.addEventListener("ratechange", updateSpeedState);
    videoContainerRef.current?.addEventListener(
      "mousemove",
      showControlsBasedOnMouseMove
    );

    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("keyup", handleKeyup);

    return () => {
      if (!video) return;
      video.removeEventListener("click", togglePlayPause);
      video.removeEventListener("dblclick", toggleFullscreen);
      video.removeEventListener("ratechange", updateSpeedState);
      videoContainerRef.current?.removeEventListener(
        "mousemove",
        showControlsBasedOnMouseMove
      );
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("keyup", handleKeyup);
    };
    // since dependency array contains both video and videoFile, it will run the effect twice when videoFile is changed
  }, [isfullScreen, video, videoFile]);
  return (
    <main
      id="mainContent"
      className="bg-black w-full min-h-[100vh] text-white flex justify-center relative"
      onDragEnter={(e) => {
        e.preventDefault();
        document.getElementById("dragOverlay")?.classList.remove("hidden");
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        if (!e.relatedTarget || !e.currentTarget.contains(e.target as Node)) {
          document.getElementById("dragOverlay")?.classList.add("hidden");
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        setVideoFile(URL.createObjectURL(file));
        document.getElementById("dragOverlay")?.classList.add("hidden");
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
    >
      <div
        className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-70 flex justify-center items-center z-10"
        id="dragOverlay"
        style={{ background: "rgba(0,0,0,0.7)" }}
      >
        <p className="text-4xl font-bold">Drop your video file here</p>
      </div>
      {videoFile && (
        <figure
          className="relative h-[100vh] max-h-[100vh] w-fit flex justify-center"
          ref={videoContainerRef}
          onMouseEnter={() => {
            if (isfullScreen) return;
            setShowControls(true);
          }}
          onMouseLeave={() => {
            if (isfullScreen) return;
            setShowControls(false);
          }}
        >
          <video
            src={videoFile}
            ref={videoRef}
            className="h-full"
            autoPlay
          ></video>
          {video && showControls && <ControlsSection video={video} />}
          {video && showControls && (
            <p className="absolute top-0 right-0 p-4 text-2xl font-extrabold z-10">
              {speed}
            </p>
          )}
        </figure>
      )}
    </main>
  );
}

export default App;
