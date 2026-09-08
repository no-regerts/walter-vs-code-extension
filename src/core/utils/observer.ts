export class Observer {
  private listeners: {type: string, cb: Function}[] = [];

  public on(type: string, cb: (errors: any) => void) {
    this.listeners.push({type, cb});
  }

  protected notifyAll(type: string, payload: any) {
    this.listeners
      .filter(i => i.type === type)
      .forEach((listener) => listener.cb(payload));
  }
}
