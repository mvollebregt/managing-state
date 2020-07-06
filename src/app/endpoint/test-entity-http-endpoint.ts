import {EntityState, EntityStore, StoreConfig} from '@datorama/akita';
import {TestEntity} from './test-entity';
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {load} from './load';
import {AkitaAllEntitiesCache} from './akita-all-entities-cache';

interface TestEntityState extends EntityState<TestEntity, number> {
}

// Declare the store. Normally, this should not be exported, but we export it here for the sake of testing.
@Injectable({providedIn: 'root'})
@StoreConfig({name: 'test-entity', idKey: 'id'})
export class TestEntityStore extends EntityStore<TestEntityState> {
  constructor() {
    super();
  }
}

// Declare the endpoint.
@Injectable({providedIn: 'root'})
export class TestEntityHttpEndpoint {

  private readonly baseUrl = 'baseUrl';
  private readonly cache: AkitaAllEntitiesCache<TestEntityState>;

  constructor(private http: HttpClient, testEntityStore: TestEntityStore) {
    this.cache = new AkitaAllEntitiesCache(testEntityStore);
  }

  getAll(): Observable<TestEntity[]> {
    return load(() => this.http.get<TestEntity[]>(this.baseUrl), this.cache);
  }

  isLoading(): Observable<boolean> {
    return this.cache.isLoading();
  }

  expireCache() {
    this.cache.setHasCache(false);
  }
}
