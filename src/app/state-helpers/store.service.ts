import {EntityStore, getEntityType, QueryEntity, withTransaction} from '@datorama/akita';
import {combineLatest, concat, Observable, of} from 'rxjs';
import {shareReplay, switchMap} from 'rxjs/operators';

export class StoreService<T> {

  protected query: QueryEntity<T>;

  constructor(
    protected store: EntityStore<T>
  ) {
    this.query = new QueryEntity(store);
  }

  // TODO: add explicit types
  load(getEntities: (...deps: any[]) => Observable<getEntityType<T>[]>, ...deps: Observable<any>[]): Observable<getEntityType<T>[]> {
    return (deps.length > 0 ? combineLatest(deps) : of([])).pipe(
      switchMap(dp => concat(
        of([]).pipe(withTransaction(() => {
          this.store.remove();
          this.store.setLoading(true);
        })),
        getEntities(...dp).pipe(
          withTransaction(entities => {
            this.store.set(entities);
            this.store.setLoading(false);
          })
        )
      ))
    ).pipe(shareReplay());
  }
}
