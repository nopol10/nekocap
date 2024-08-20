export default class XMLHttpRequestPolyfillBase {
  public readonly DONE: 4 = 4;
  public readonly HEADERS_RECEIVED: 2 = 2;
  public readonly LOADING: 3 = 3;
  public readonly OPENED: 1 = 1;
  public readonly UNSENT: 0 = 0;

  public readyState: number = this.UNSENT;
  public response: any;
  public responseText = "";
  public responseType: XMLHttpRequestResponseType = "";
  public responseURL = "";
  public responseXML: Document | null = null;
  public status = -1;
  public statusText = "";
  public timeout = -1;
  public upload: XMLHttpRequestUpload = null as any;
  public withCredentials = false;
}
