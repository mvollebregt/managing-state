import {concat, Observable, of} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';

export interface WithLoadingIndicator<T> {
  loading: boolean;
  data: T | undefined;
}

export function withLoadingIndicator<T>(response: Observable<T>): Observable<WithLoadingIndicator<T>> {
  return concat(
    of<WithLoadingIndicator<T>>({loading: true, data: undefined}),
    response.pipe(map(data => ({loading: false, data})))
  ).pipe(
    shareReplay()
  );
}

