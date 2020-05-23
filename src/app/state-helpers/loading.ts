import {concat, Observable, of} from 'rxjs';
import {WithLoadingIndicator} from './with-loading-indicator';
import {map} from 'rxjs/operators';

export function loading<T>(obs: Observable<T>): Observable<WithLoadingIndicator<T>> {
  return concat(
    of({___loading: true, data: undefined as T}),
    obs.pipe(map(data => ({___loading: false, data})))
  );
}

