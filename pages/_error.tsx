"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Error boundary caught an error:", error);
  }, [error]);

  return (
    <div>
      <h2>发生错误</h2>
      <p>{error.message || "未知错误"}</p>
      <button onClick={() => reset()}>重试</button>
    </div>
  );
}
