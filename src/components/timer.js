import React from "react";
import { useEffect } from 'react';
import { useStopwatch } from 'react-timer-hook';

export default function MyStopwatch() {
  const {
    seconds,
    minutes,
    hours,
    days,
    isRunning,
    start,
    pause,
    reset,
  } = useStopwatch({ autoStart: true });

    useEffect(() => {
      start();
    }, [])

  return (
      <div>
        <span>{hours < 10 && "0"}{hours}</span>:<span>{minutes < 10 && "0"}{minutes}</span>:<span>{seconds < 10 && "0"}{seconds}</span>
      </div>
  );
}
