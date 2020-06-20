import {EntityStore, getEntityType, QueryEntity, withTransaction} from '@datorama/akita';
import {combineLatest, concat, Observable, of} from 'rxjs';
import {shareReplay, switchMap} from 'rxjs/operators';

export class StoreService<T> {

  protected query: QueryEntity<T>;

  readonly loading: Observable<boolean>;

  constructor(protected store: EntityStore<T>) {
    this.query = new QueryEntity(store);
    this.loading = this.query.selectLoading();
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
      switchMap(dp => concat(
        of([]).pipe(withTransaction(() => {
          this.store.remove();
          this.store.setLoading(true);
        })),
        getEntities(...dp).pipe(
          withTransaction(entities => {
            this.store.upsertMany(entities);
            this.store.setLoading(false);
          })
        )
      ))
    ).pipe(shareReplay());
  }
}
