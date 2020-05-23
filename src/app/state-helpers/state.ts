import {BehaviorSubject, concat, Observable, of} from 'rxjs';
import {distinctUntilChanged, map, shareReplay, tap} from 'rxjs/operators';
import {WithLoadingIndicator} from './with-loading-indicator';

export abstract class State<T> {

  private stateSubject = new BehaviorSubject<T>({} as T);
  private loadingIndicators = {} as {[K in keyof Partial<T>]: BehaviorSubject<boolean>};
  private cachedGetters = {} as {[K in keyof Partial<T>]: Observable<T[K] | WithLoadingIndicator<T[K]>>};

  constructor(private getters?: {[K in keyof Partial<T>]: () => Observable<T[K] | WithLoadingIndicator<T[K]>>}) {
  }

  // TODO: combined get
  get<K extends keyof T>(property: K): Observable<T[K]> {
    if (!this.cachedGetters[property]) {
      if (this.getters && this.getters[property]) {
        // for more caching options, including refreshing on a trigger,
        // see https://blog.thoughtram.io/angular/2018/03/05/advanced-caching-with-rxjs.html
        this.cachedGetters[property] = this.getters[property]().pipe(
          distinctUntilChanged(),
          shareReplay()
        );
      } else {
        this.cachedGetters[property] = this.stateSubject.pipe(
          map(state => state[property]),
          distinctUntilChanged(),
          shareReplay()
        );
      }
    }
    return this.cachedGetters[property].pipe(
      map(x => {
        if (this.hasLoadingIndicator(x)) {
          setTimeout(() =>
            this.getLoadingIndicator(property).next(x.___loading)
          );
          return x.data;
        } else {
          return x;
        }
      }),
    );
  }

  loading(property: keyof T): Observable<boolean> {
    return this.getLoadingIndicator(property).pipe(
      distinctUntilChanged(),
      shareReplay()
    );
  }

  patch(changes: Partial<T>) {
    this.stateSubject.next({...this.stateSubject.value, ...changes});
  }

  private getLoadingIndicator(property: keyof T) {
    if (!this.loadingIndicators[property]) {
      this.loadingIndicators[property] = new BehaviorSubject(false);
    }
    return this.loadingIndicators[property];
  }

  private hasLoadingIndicator<S>(obj: S | WithLoadingIndicator<S>): obj is WithLoadingIndicator<S> {
    return obj && (obj as WithLoadingIndicator<S>).___loading !== undefined;
  }
}
