import {EntityState, EntityStore, StoreConfig} from '@datorama/akita';
import {TestEntity} from './test-entity';
import {Injectable} from '@angular/core';
import {HttpEndpoint} from './http-endpoint';
import {HttpClient} from '@angular/common/http';
import {AkitaHttpEndpointCache} from './akita-http-endpoint-cache';

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
export class TestEntityHttpEndpoint extends HttpEndpoint<TestEntity> {

  constructor(httpClient: HttpClient, testEntityStore: TestEntityStore) {
    super(httpClient, 'baseUrl', new AkitaHttpEndpointCache(testEntityStore));
  }

}
