export function ChromeStorageController(): any {
  const store: any = {};
  store.async = 1;
  store.getItemAsync = function (path) {
    return new Promise((resolve) => {
      chrome.storage.local.get(path, function (data) {
        resolve(data[path]);
      });
    });
  };
  store.getAllKeysAsync = function () {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, function (items) {
        resolve(Object.keys(items));
      });
    });
  };
  store.setItemAsync = function (path, value) {
    return new Promise((resolve) => {
      const item = Object.create(null);
      item[path] = value;
      chrome.storage.local.set(item, () => {
        resolve(value);
      });
    });
  };
  store.removeItemAsync = function (path) {
    return new Promise<void>((resolve) => {
      chrome.storage.local.remove(path, () => {
        resolve();
      });
    });
  };
  store.clear = function () {
    chrome.storage.local.clear();
  };
  return store;
}
