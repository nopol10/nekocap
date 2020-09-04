import * as dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import utc from "dayjs/plugin/utc";
import { TIME } from "./constants";

dayjs.extend(duration);
dayjs.extend(utc);

export const formatDuration = (
  duration: plugin.Duration,
  format = "HH:mm:ss.SSS"
) => {
  if (duration.asDays() > 1) {
    return duration.days() + " day" + (duration.days() > 1 ? "s" : "");
  } else {
    return dayjs.utc(duration.asMilliseconds()).format(format);
  }
};

/**
 * Returns a dayjs duration with the given input of HH:mm:ss.SSS format
 * @param duration
 */
export const parseDurationToMs = (duration: string) => {
  const [main, ms] = duration.split(".");
  const [hours, minutes, seconds] = main.split(":");
  const totalMs =
    parseInt(ms) +
    parseInt(seconds) * TIME.SECONDS_TO_MS +
    parseInt(minutes) * TIME.MINUTES_TO_SECONDS * TIME.SECONDS_TO_MS +
    parseInt(hours) *
      TIME.HOURS_TO_MINUTES *
      TIME.MINUTES_TO_SECONDS *
      TIME.SECONDS_TO_MS;
  return totalMs;
};
