export const waitForElement = async <T extends HTMLElement>(
  selector: string
): Promise<T> => {
  return new Promise<T>((resolve) => {
    const observer = new MutationObserver(function (mutations, me) {
      const element = document.querySelector(selector);
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

export const clearSelection = () => {
  // @ts-ignore
  const sel = window.getSelection ? window.getSelection() : document.selection;
  if (sel) {
    if (sel.removeAllRanges) {
      sel.removeAllRanges();
    } else if (sel.empty) {
      sel.empty();
    }
  }
};

export const getStringByteLength = (input: string) => {
  return new TextEncoder().encode(input).length;
};

export const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(value, min));
};

export const convertBlobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
  });

export const isInputElementSelected = () => {
  return (
    document.activeElement &&
    (document.activeElement.tagName === "TEXTAREA" ||
      document.activeElement.tagName === "INPUT")
  );
};

/**
 * Round the given milliseconds to the nearest second but returns the result in milliseconds
 * @param timeMs duration in milliseconds
 */
export const roundMs = (timeMs: number) => {
  return Math.round(timeMs / 1000) * 1000;
};

export const generateRandomId = () => {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
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

  mutationObserver.observe(window.document, {
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

  mutationObserver.observe(window.document, {
    childList: true,
    subtree: true,
  });
  return mutationObserver;
};
