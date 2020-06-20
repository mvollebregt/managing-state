import {TestBed} from '@angular/core/testing';

import {StoreService} from './store.service';
import {Injectable} from '@angular/core';
import {EntityState, EntityStore, getEntityType, QueryEntity, StoreConfig} from '@datorama/akita';
import {Subject, Subscription} from 'rxjs';

// Define the entity.
interface TestEntity {
  id: number;
}

// Define the state interface.
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
class TestEntityService extends StoreService<TestEntityState> {
  // For the sake of testing, we make the query property public.
  query: QueryEntity<TestEntityState>;
  mockSubject = new Subject<TestEntity[]>();
  constructor(protected store: TestEntityStore) {
    super(store);
  }
  testEntities = this.load(() => this.mockSubject);
}

describe('StoreService', () => {

  const result = [{id: 1}, {id: 2}];
  const subscriptions: Subscription[] = [];
  let store: TestEntityStore;
  let service: TestEntityService;
  let loading: boolean | undefined;
  let entities: TestEntity[] | undefined;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TestEntityStore);
    service = new TestEntityService(store);
    subscriptions.push(service.loading.subscribe(value => loading = value));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.query).toBeTruthy();
    expect(service.query.__store__).toEqual(store);
    expect(loading).toBe(true);
  });

  it('should load entities', () => {
    subscriptions.push(service.testEntities.subscribe(value => entities = value));
    expect([loading, entities]).toEqual([true, []]);
    service.mockSubject.next(result);
    expect([loading, entities]).toEqual([false, result]);
  });

  it('should cache loaded entities', () => {
    // Given: a subscription to testEntities already exists.
    subscriptions.push(service.testEntities.subscribe());
    // And: the value was already submitted.
    service.mockSubject.next(result);
    // When: subscribing to testEntities again.
    subscriptions.push(service.testEntities.subscribe(value => entities = value));
    // Then: the previous subscription is shared.
    expect([loading, entities]).toEqual([false, result]);
  });

  it('should put cached entities in the store', done => {
    subscriptions.push(service.testEntities.subscribe(value => entities = value));
    service.mockSubject.next(result);
    service.query.selectAll().subscribe(allInStore => {
      expect(allInStore).toEqual(result);
      done();
    });
  });

  it('should do something with dependencies?', () => {
    // TODO: but what? should the store be made empty before reloading?
  });

  afterEach(() => {
    subscriptions.forEach(subscription => subscription.unsubscribe());
  });
});
