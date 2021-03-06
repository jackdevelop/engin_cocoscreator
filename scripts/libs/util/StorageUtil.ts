export default class StorageUtil {
  public static set(key: string, value: any) {
    cc.sys.localStorage.setItem(key, JSON.stringify(value));
  }
  public static get(key: string, parse: boolean = true): any {
    const value = cc.sys.localStorage.getItem(key);
    return parse ? JSON.parse(value) : value;
  }
  public static remove(key: string) {
    cc.sys.localStorage.removeItem(key);
  }
}
window["eazax"] && (window["eazax"]["storage"] = StorageUtil);
