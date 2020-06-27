import {applyTransaction, EntityStore, getEntityType, QueryEntity, withTransaction} from '@datorama/akita';
import {combineLatest, concat, Observable, of} from 'rxjs';
import {filter, shareReplay, switchMap, switchMapTo, tap, withLatestFrom} from 'rxjs/operators';

export class EntityService<T> {

  protected query: QueryEntity<T>;

  readonly loading: Observable<boolean>;

  constructor(protected store: EntityStore<T>) {
    this.query = new QueryEntity(store);
    this.loading = this.query.selectLoading();
    this.store.setLoading(false);
  }

  expireCache() {
    this.store.setHasCache(false);
  }

  protected load(
    getEntities: () => Observable<getEntityType<T>[]>): Observable<getEntityType<T>[]>;
  protected load<A>(
    a: Observable<A>,
    getEntities: (a: A) => Observable<getEntityType<T>[]>): Observable<getEntityType<T>[]>;
  protected load<A, B>(
    a: Observable<A>, b: Observable<B>,
    getEntities: (a: A, b: B) => Observable<getEntityType<T>[]>): Observable<getEntityType<T>[]>;
  protected load<A, B, C>(
    a: Observable<A>, b: Observable<B>, c: Observable<C>,
    getEntities: (a: A, b: B, c: C) => Observable<getEntityType<T>[]>): Observable<getEntityType<T>[]>;

  protected load(...params: any[]): Observable<getEntityType<T>[]> {
    const getEntities = params.pop();
    return this.doLoad(params, getEntities);
  }

  private doLoad(deps: Observable<any>[],
                 getEntities: (...deps: any[]) => Observable<getEntityType<T>[]>): Observable<getEntityType<T>[]> {
    return (deps.length > 0 ? combineLatest(deps) : of([])).pipe(
      withLatestFrom(this.loading),
      tap(([dp, loading]) => {
        // If the cache is empty and we are not already loading, trigger a new load on subscribe
        if (!loading && !this.query.getHasCache()) {
          applyTransaction(() => {
            // this.store.remove(); // only remove values when deps have changed, not on plain refresh
            this.store.setLoading(true);
          });
          getEntities(...dp).subscribe(entities =>
            applyTransaction(() => {
              this.store.set(entities);
            })
          );
        }
      }),
      switchMapTo(this.query.selectAll())
    );
  }
}
