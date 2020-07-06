import {ResourceCache} from './resource-cache';
import {Observable} from 'rxjs';
import {EntityStore, getEntityType, QueryEntity} from '@datorama/akita';

export class AkitaAllEntitiesCache<T> implements ResourceCache<getEntityType<T>[]> {

  constructor(private store: EntityStore<T>,
              private query: QueryEntity<T> = new QueryEntity(store)) {
    this.store.setLoading(false);
  }

  getCachedData(): Observable<getEntityType<T>[]> {
    return this.query.selectAll();
  }

  setCachedData(data: getEntityType<T>[]): void {
    this.store.set(data);
  }

  hasCache(): Observable<boolean> {
    return this.query.selectHasCache();
  }

  setHasCache(hasCache: boolean) {
    this.store.setHasCache(hasCache);
  }


  isLoading(): Observable<boolean> {
    return this.query.selectLoading();
  }

  setLoading(loading: boolean): void {
    this.store.setLoading(loading);
  }
}
