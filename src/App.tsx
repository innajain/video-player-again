import { useEffect, useRef, useState } from "react";
import videoFile from "D:/Shows/The Office/Season 1/The.Office.US.S01E01.Pilot.720p.WEBRip.2CH.x265.HEVC_PSA_0.mkv.mp4";
import ControlsSection from "./ControlsSection";

function App() {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [video, setVideo] = useState<HTMLVideoElement>();
  const [speed, setSpeed] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [isfullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (videoRef.current) setVideo(videoRef.current);
    if (!video) {
      return;
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

    let seekInterval: NodeJS.Timeout | null = null;
    let holdPromise: Promise<void> | null = null;
    let isHoldPromiseResolved = false;
    let holdPromiseTimeout: NodeJS.Timeout | null = null;

    function startSmoothSeekingForward() {
      if (!video) return;
      seekInterval = setInterval(() => seekForward(video, 30), 500); // Adjust the interval as needed
    }

    function startSmoothSeekingBackward() {
      if (!video) return;
      seekInterval = setInterval(() => seekBackward(video, 30), 500); // Adjust the interval as needed
    }

    function stopSmoothSeeking() {
      if (!seekInterval) return;
      clearInterval(seekInterval);
      seekInterval = null;
    }

    function getHoldPromise(timeout = 500) {
      return new Promise<void>((resolve) => {
        holdPromiseTimeout = setTimeout(() => {
          resolve();
          isHoldPromiseResolved = true;
        }, timeout);
      });
    }

    function captureHold(duringHoldFunc: () => void) {
      if (!holdPromise) {
        holdPromise = getHoldPromise();
        holdPromise.then(() => {
          duringHoldFunc();
        });
      }
    }

    let savedSpeed: number | null = null;
    let savedPlayPauseState: "play" | "pause" | null = null;

    function tempSpeed2x() {
      if (!video) return;
      savedSpeed = video.playbackRate;
      video.playbackRate = 2;
      savedPlayPauseState = video.paused ? "pause" : "play";
      if (video.paused) video.play();
    }

    function doomOfHold(afterHoldFunc: () => void, noHoldFunc: () => void) {
      if (!isHoldPromiseResolved) {
        noHoldFunc();
        clearTimeout(holdPromiseTimeout!);
      } else {
        afterHoldFunc();
        clearInterval(seekInterval!);
      }

      holdPromise = null;
      holdPromiseTimeout = null;
      seekInterval = null;
      isHoldPromiseResolved = false;
    }

    function revertSpeed() {
      if (!video) return;
      video.playbackRate = savedSpeed!;
      if (savedPlayPauseState === "play") video.play();
      else video.pause();
    }

    function updateSpeedState() {
      setSpeed(video!.playbackRate);
    }

    let mouseMoveTimeoutPromise: Promise<void> | null = null;
    let mouseMoveTimeoutPromiseResolved = true;

    function showControlsBasedOnMouseMove() {
      if (!isfullScreen || !mouseMoveTimeoutPromiseResolved) return;
      console.log("first");
      setShowControls(true);
      mouseMoveTimeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
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
      } else if (e.key === "f" || e.key === "F") toggleFullscreen();
      else if (e.key === "ArrowRight" && !e.ctrlKey) {
        captureHold(startSmoothSeekingForward);
      } else if (e.key === "ArrowLeft" && !e.ctrlKey) {
        captureHold(startSmoothSeekingBackward);
      } else if (e.key === "ArrowRight" && e.ctrlKey) seekForward(video, 10);
      else if (e.key === "ArrowLeft" && e.ctrlKey) seekBackward(video, 10);
      else if ("0123456789".includes(e.key)) {
        if (!video) return;
        const n = parseInt(e.key);
        const newTime = (n / 10) * video.duration;
        video.currentTime = newTime;
      } else if (e.key === ".") goToNextFrame(video);
      else if (e.key === ",") goToPreviousFrame(video);
      else if (e.key === "+") increasePlaybackRate(video);
      else if (e.key === "-") decreasePlaybackRate(video);
    }

    function handleKeyup(e: KeyboardEvent) {
      if (!video) return;
      if (e.key === " ") {
        doomOfHold(revertSpeed, () => togglePlayPause(video));
      } else if (e.key === "ArrowRight" && !e.ctrlKey) {
        doomOfHold(stopSmoothSeeking, () => seekForward(video, 5));
      } else if (e.key === "ArrowLeft" && !e.ctrlKey) {
        doomOfHold(stopSmoothSeeking, () => seekBackward(video, 5));
      }
    }

    video.addEventListener("click", () => togglePlayPause(video));
    video.addEventListener("dblclick", toggleFullscreen);
    video.addEventListener("ratechange", updateSpeedState);
    videoRef.current?.addEventListener(
      "mousemove",
      showControlsBasedOnMouseMove
    );

    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("keyup", handleKeyup);

    return () => {
      video.removeEventListener("click", () => togglePlayPause(video));
      video.removeEventListener("dblclick", toggleFullscreen);
      video.removeEventListener("ratechange", updateSpeedState);
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("keyup", handleKeyup);
    };
  }, [video, isfullScreen, showControls, speed]);
  return (
    <main className="bg-black w-full min-h-[100vh] text-white flex justify-center">
      <figure
        className="relative h-[100vh] max-h-[100vh] w-fit"
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
        <video src={videoFile} ref={videoRef} className="h-full"></video>
        {video && showControls && <ControlsSection video={video} />}
        {video && showControls && (
          <p className="absolute top-0 right-0 p-4 text-2xl font-extrabold z-10">
            {speed}
          </p>
        )}
      </figure>
    </main>
  );
}

export default App;
