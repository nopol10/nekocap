import { useEffect, useState } from "react";
import { getURL, waitUntil } from "../utils";

export function useCanUseWorker() {
  const [canUse, setCanUse] = useState<boolean | null>(null);
  useEffect(() => {
    canUseWorker().then((result) => {
      setCanUse(result);
    });
  }, []);
  return canUse;
}

async function canUseWorker() {
  try {
    const worker = new Worker(
      getURL("js/subtitle-octopus/subtitles-octopus-worker.js"),
    );
    console.log(
      "Worker is",
      worker,
      "worker instanceof Worker",
      worker instanceof Worker,
    );
    // @ts-ignore
    if (!(worker instanceof (global.OriginalWorker || globalThis.Worker))) {
      // It has been polyfilled with the WorkerXHR polyfill
      console.log("Worker is not a normal worker");
      await waitUntil(() => {
        console.log("Waiting...");
        return (
          worker["initialized"] === true ||
          worker["failedToInitialize"] === true
        );
      });
      const failed = worker["failedToInitialize"];
      if (failed) {
        console.log("Failed to initialize the worker");
        return false;
      }
    }
  } catch (e) {
    console.error("Failed to load the worker script:", e);
    return false;
  }
  return true;
}
