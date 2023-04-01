export const waitForElement = async <T extends HTMLElement>(
  selector: string,
  parentElement: HTMLElement | null = null
): Promise<T> => {
  return new Promise<T>((resolve) => {
    const observer = new MutationObserver(function (mutations, me) {
      const element = (parentElement ?? document).querySelector(selector);
      if (element) {
        me.disconnect(); // stop observing
        resolve(element as T);
        return;
      }
    });

    observer.observe(document, {
      childList: true,
      subtree: true,
    });
  });
};

export const getLimitOffsetFromPagination = (
  pageSize: number,
  pageNumber: number
) => {
  return {
    limit: Math.max(1, pageSize),
    offset: (Math.max(1, pageNumber) - 1) * pageSize,
  };
};

export const getPaginationFromLimitOffset = (limit: number, offset: number) => {
  const pageSize = Math.max(1, limit);
  return {
    pageSize: pageSize,
    pageNumber: Math.max(0, offset) / pageSize,
  };
};

export const clearSelection = (): void => {
  const sel = globalThis.getSelection
    ? globalThis.getSelection()
    : // @ts-ignore
      document.selection;
  if (sel) {
    if (sel.removeAllRanges) {
      sel.removeAllRanges();
    } else if (sel.empty) {
      sel.empty();
    }
  }
};

export const getStringByteLength = (input: string): number => {
  return new TextEncoder().encode(input).length;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(value, min));
};

export const convertBlobToBase64 = (blob: Blob): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
  });

export const isInputElementSelected = (): boolean => {
  if (!document.activeElement) {
    return false;
  }
  return (
    document.activeElement.tagName === "TEXTAREA" ||
    document.activeElement.tagName === "INPUT"
  );
};

/**
 * Round the given milliseconds to the nearest second but returns the result in milliseconds
 * @param timeMs duration in milliseconds
 */
export const roundMs = (timeMs: number): number => {
  return Math.round(timeMs / 1000) * 1000;
};

export const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const createElementAdditionObserver = (
  elementSelector: string,
  addedCallback: () => void
): MutationObserver => {
  const mutationObserver = new MutationObserver(function (mutations) {
    if (mutations.length <= 0) {
      return;
    }
    mutations.forEach((mutation) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mutation.addedNodes.forEach((addedNode: any) => {
        if (!addedNode["tagName"]) return;
        const element = addedNode as HTMLElement;
        const addedElement = element.querySelector(elementSelector);
        if (addedElement) {
          addedCallback();
        }
      });
    });
  });

  mutationObserver.observe(globalThis.document, {
    childList: true,
    subtree: true,
  });
  return mutationObserver;
};

export const createElementRemovalObserver = (
  elementSelector: string,
  removedCallback: () => void
): MutationObserver => {
  const mutationObserver = new MutationObserver(function (mutations) {
    if (mutations.length <= 0) {
      return;
    }
    mutations.forEach((mutation) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mutation.removedNodes.forEach((removedNode: any) => {
        if (!removedNode["tagName"]) return;
        const element = removedNode as HTMLElement;
        const removedElement = element.querySelector(elementSelector);
        if (removedElement) {
          removedCallback();
        }
      });
    });
  });

  mutationObserver.observe(globalThis.document, {
    childList: true,
    subtree: true,
  });
  return mutationObserver;
};

// https://stackoverflow.com/a/14824756
export const isRTLString = (str: string): boolean => {
  const ltrChars =
    "A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF";
  const rtlChars = "\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC";
  // eslint-disable-next-line no-misleading-character-class
  const rtlDirCheck = new RegExp("^[^" + ltrChars + "]*[" + rtlChars + "]");
  return rtlDirCheck.test(str);
};

export const delay = (milliseconds: number): Promise<void> => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

export const waitUntil = async (predicate: () => boolean): Promise<void> => {
  while (!predicate()) {
    await delay(500);
  }
};

type ValidValue<T> = Exclude<T, null | undefined | 0 | "" | false>;
export const BooleanFilter = <T>(x: T): x is ValidValue<T> => Boolean(x);
