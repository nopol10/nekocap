import * as dayjs from "dayjs";
import { useEffect } from "react";
import { DAYJS_LOCALES } from "../dayjs-locales";

export const useDayjsLocale = (locale = "en-US"): void => {
  useEffect(() => {
    const dayjsLocale = DAYJS_LOCALES[locale];
    if (dayjsLocale) {
      import(`dayjs/locale/${dayjsLocale}.js`).then(() => {
        dayjs.locale(dayjsLocale);
      });
    }
  }, [locale]);
};
