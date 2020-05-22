import {concat, Observable, of, timer} from 'rxjs';
import {WithLoadingIndicator} from './with-loading-indicator';
import {map, shareReplay, startWith, switchMap, tap} from 'rxjs/operators';

class Resource<K, T> {

  private cache: Observable<WithLoadingIndicator<T>>;

  constructor(
    private getter: (params: K) => Observable<T>,
    private deps: Observable<K>) {
  }

  get(): Observable<WithLoadingIndicator<T>> {
    if (!this.cache) {
      this.cache = this.deps.pipe(
        switchMap(deps =>
          concat(
            of<WithLoadingIndicator<T>>({loading: true, data: undefined}),
            this.getter(deps).pipe(map(data => ({loading: false, data})))
          )),
        // for more caching options, including refreshing on a trigger,
        // see https://blog.thoughtram.io/angular/2018/03/05/advanced-caching-with-rxjs.html
        shareReplay()
      );
    }
    return this.cache;
  }
}

export function resource<K, T>(getter: (params: K) => Observable<T>, deps: Observable<K> = of({} as K)) {
  return new Resource(getter, deps);
}
