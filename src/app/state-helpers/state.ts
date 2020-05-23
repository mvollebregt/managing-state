import {BehaviorSubject, concat, Observable, of} from 'rxjs';
import {distinctUntilChanged, map, shareReplay, tap} from 'rxjs/operators';

export abstract class State<T> {

  private stateSubject = new BehaviorSubject<T>({} as T);
  private cachedGetters = {} as {[K in keyof Partial<T>]: Observable<T[K]>};
  private getters: { [K in keyof Partial<T>]: () => Observable<T[K]> };

  createQueries(getters?: {[K in keyof Partial<T>]: () => Observable<T[K]>}) {
    this.getters = getters;
  }

  // TODO: combined get
  get<K extends keyof T>(property: K): Observable<T[K]> {
    if (!this.cachedGetters[property]) {
      if (this.getters && this.getters[property]) {
        // TODO: shared? distinct until changed?
        this.cachedGetters[property] = this.getters[property]();
      } else {
        this.cachedGetters[property] = this.stateSubject.pipe(
          map(state => state[property]),
          distinctUntilChanged()
        );
      }
    }
    return this.cachedGetters[property];
  }

  patch(changes: Partial<T>) {
    this.stateSubject.next({...this.stateSubject.value, ...changes});
  }
}
