import {TestBed} from '@angular/core/testing';

import {EntityService} from './entity.service';
import {Injectable} from '@angular/core';
import {EntityState, EntityStore, getEntityType, QueryEntity, StoreConfig} from '@datorama/akita';
import {Observable, Subject, Subscription} from 'rxjs';
import {take, tap} from 'rxjs/operators';
import {Mock} from 'protractor/built/driverProviders';
import {HttpClientMock} from './http-client-mock';

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
class TestEntityService extends EntityService<TestEntityState> {
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

describe('EntityService simple load', () => {

  const result = [{id: 1}, {id: 2}];
  const subscriptions: Subscription[] = [];
  let store: TestEntityStore;
  let service: TestEntityService;
  let loading: boolean | undefined;
  let entities: TestEntity[] | undefined;
  let entitiesOfSecondCall: TestEntity[] | undefined;

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
    subscriptions.push(service.getTestEntities().subscribe(value => entities = value));
    expect([loading, entities]).toEqual([true, []]);
    service.mockedHttpClient.emit(result);
    expect([loading, entities]).toEqual([false, result]);
  });

  it('should put entities in the store', done => {
    subscriptions.push(service.getTestEntities().subscribe());
    service.mockedHttpClient.emit(result);
    subscriptions.push(service.query.selectAll().subscribe(allInStore => {
      expect(allInStore).toEqual(result);
      done();
    }));
  });

  it('should share two simultaneous subscriptions to the same observable', () => {
    const observable = service.getTestEntities();
    subscriptions.push(observable.subscribe(value => entities = value));
    subscriptions.push(observable.subscribe(value => entitiesOfSecondCall = value));
    service.mockedHttpClient.emit(result);
    expect([loading, entities, entitiesOfSecondCall]).toEqual([false, result, result]);
    expect(service.mockedHttpClient.callCount).toBe(1);
  });

  it('should share two simultaneous subscriptions to different observables', () => {
    subscriptions.push(service.getTestEntities().subscribe(value => entities = value));
    subscriptions.push(service.getTestEntities().subscribe(value => entitiesOfSecondCall = value));
    service.mockedHttpClient.emit(result);
    expect([loading, entities, entitiesOfSecondCall]).toEqual([false, result, result]);
    expect(service.mockedHttpClient.callCount).toBe(1);
  });

  it('should share a second call to the same observable after it has completed', () => {
    const observable = service.getTestEntities();
    subscriptions.push(observable.subscribe(value => entities = value));
    service.mockedHttpClient.emit(result);
    subscriptions.push(observable.subscribe(value => entitiesOfSecondCall = value));
    expect([loading, entities, entitiesOfSecondCall]).toEqual([false, result, result]);
    expect(service.mockedHttpClient.callCount).toBe(1);
  });

  it('should share a second call to a different observable after it has completed', () => {
    subscriptions.push(service.getTestEntities().subscribe(value => entities = value));
    service.mockedHttpClient.emit(result);
    subscriptions.push(service.getTestEntities().subscribe(value => entitiesOfSecondCall = value));
    expect([loading, entities, entitiesOfSecondCall]).toEqual([false, result, result]);
    expect(service.mockedHttpClient.callCount).toBe(1);
  });

  it('should share a second call to a different observable after it was unsubscribed', () => {
    const subscription = service.getTestEntities().subscribe(value => entities = value);
    service.mockedHttpClient.emit(result);
    subscription.unsubscribe();
    subscriptions.push(service.getTestEntities().subscribe(value => entitiesOfSecondCall = value));
    expect([loading, entities, entitiesOfSecondCall]).toEqual([false, result, result]);
    expect(service.mockedHttpClient.callCount).toBe(1);
  });

  afterEach(() => {
    subscriptions.forEach(subscription => subscription.unsubscribe());
    service.mockedHttpClient.terminate();
  });
});
