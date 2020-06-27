// Define the state interface.
import {EntityState, EntityStore, QueryEntity, StoreConfig} from '@datorama/akita';
import {Injectable} from '@angular/core';
import {EntityService} from './entity.service';
import {HttpClientMock} from './http-client-mock';
import {TestEntity} from './test-entity';

interface TestEntityState extends EntityState<TestEntity, number> {
}

// Declare the store.
@Injectable({providedIn: 'root'})
@StoreConfig({name: 'test-entity', idKey: 'id'})
class TestEntityStore extends EntityStore<TestEntityState> {
  constructor() {
    super();
  }
}

// Declare the service.
@Injectable({providedIn: 'root'})
export class TestEntityService extends EntityService<TestEntityState> {
  // For the sake of testing, we make the query property public.
  query: QueryEntity<TestEntityState>;
  mockedHttpClient = new HttpClientMock<TestEntity[]>();

  constructor(protected store: TestEntityStore) {
    super(store);
  }

  getTestEntities() {
    return this.load(() => this.mockedHttpClient.get());
  }
}
