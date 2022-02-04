export default class XMLHttpRequestPolyfillBase {
  public readonly DONE: number = 4;
  public readonly HEADERS_RECEIVED: number = 2;
  public readonly LOADING: number = 3;
  public readonly OPENED: number = 1;
  public readonly UNSENT: number = 0;

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
