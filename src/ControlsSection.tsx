import { useEffect, useState } from "react";

function getTimeString(seconds: number) {
  seconds = Math.floor(seconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function ControlsSection({ video }: { video: HTMLVideoElement }) {
  const [currentTimeFraction, setCurrentTimeFraction] = useState(0);
  const [timelineHovered, setTimelineHovered] = useState(false);
  useEffect(() => {
    // ontimeupdate is not firing befo  re video plays (don't know why)
    video.addEventListener("timeupdate", () => {
      setCurrentTimeFraction(video.currentTime / video.duration);
    });
  }, []);
  return (
    <section
      className="absolute bottom-0 w-full h-10 shrink-0 flex gap-5 items-center px-5"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      }}
    >
      <p className="text-nowrap">
        {getTimeString(currentTimeFraction * video.duration)} /{" "}
        {getTimeString(video.duration)}
      </p>
      <div
        className="w-full bg-white h-[3px] hover:h-1 flex relative cursor-pointer"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.5)",
        }}
        onMouseEnter={() => setTimelineHovered(true)}
        onMouseLeave={() => setTimelineHovered(false)}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const fraction = x / rect.width;
          video.currentTime = fraction * video.duration;
        }}
      >
        <div
          className="bg-red-700 h-full"
          style={{
            width: `${currentTimeFraction * 100}%`,
            transition: "width 0.2s ease",
          }}
        ></div>
        {timelineHovered && (
          <div
            className="rounded-full w-3 bg-red-700 aspect-square absolute -translate-y-1"
            style={{
              left: `calc(${currentTimeFraction * 100}% - 6px)`,
              transition: "left 0.2s ease",
            }}
          ></div>
        )}
      </div>
    </section>
  );
}

export default ControlsSection;
