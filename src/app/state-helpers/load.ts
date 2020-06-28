import {combineLatest, Observable, of} from 'rxjs';
import {switchMapTo, tap, withLatestFrom} from 'rxjs/operators';
import {ResourceCache} from './resource-cache';

export function load<R>(
  getResource: () => Observable<R>,
  resourceCache: ResourceCache<R>
): Observable<R>;
export function load<A, R>(
  a: Observable<A>,
  getResource: (a: A) => Observable<R>,
  resourceCache: ResourceCache<R>
): Observable<R>;
export function load<A, B, R>(
  a: Observable<A>, b: Observable<B>,
  getResource: (a: A, b: B) => Observable<R>,
  resourceCache: ResourceCache<R>
): Observable<R>;
export function load<A, B, C, R>(
  a: Observable<A>, b: Observable<B>, c: Observable<C>,
  getResource: (a: A, b: B, c: C) => Observable<R>,
  resourceCache: ResourceCache<R>
): Observable<R>;

export function load<R>(...params: any[]): Observable<R> {
  const resourceCache = params.pop();
  const getResource = params.pop();
  return doLoad(params, getResource, resourceCache);
}

function doLoad<R>(parameters: Observable<any>[],
                   getResource: (...deps: any[]) => Observable<R>,
                   resourceCache: ResourceCache<R>): Observable<R> {
  return (parameters.length > 0 ? combineLatest(parameters) : of([])).pipe(
    withLatestFrom(resourceCache.isLoading(), resourceCache.hasCache()),
    tap(([params, loading, hasCache]) => {
      // If the cache is empty and we are not already loading, trigger a new load on subscribe
      if (!loading && !hasCache) {
        resourceCache.setLoading(true);
        getResource(...params).subscribe(entities =>
          resourceCache.setCachedData(entities)
        );
      }
    }),
    switchMapTo(resourceCache.getCachedData())
  );
}
