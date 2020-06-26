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

  const returnValue = [{id: 1}, {id: 2}];
  const firstEmptyThenResult = [[], returnValue];
  const immediateResult = [returnValue];

  const subscriptions: Subscription[] = [];

  let emissions: TestEntity[][];
  let secondEms: TestEntity[][];
  let loading: boolean | undefined;
  let store: TestEntityStore;
  let service: TestEntityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TestEntityStore);
    service = new TestEntityService(store);
    subscriptions.push(service.loading.subscribe(value => loading = value));
    emissions = [];
    secondEms = [];
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.query).toBeTruthy();
    expect(service.query.__store__).toEqual(store);
    expect(loading).toBe(false);
  });

  it('should load entities', () => {
    subscriptions.push(service.getTestEntities().subscribe(value => emissions.push(value)));
    expect([loading, emissions]).toEqual([true, [[]]]);
    service.mockedHttpClient.emit(returnValue);
    expect([loading, emissions]).toEqual([false, firstEmptyThenResult]);
  });

  it('should put entities in the store', done => {
    subscriptions.push(service.getTestEntities().subscribe());
    service.mockedHttpClient.emit(returnValue);
    subscriptions.push(service.query.selectAll().subscribe(allInStore => {
      expect(allInStore).toEqual(returnValue);
      done();
    }));
  });

  it('should share two simultaneous subscriptions to the same observable', () => {
    const observable = service.getTestEntities();
    subscriptions.push(observable.subscribe(value => emissions.push(value)));
    subscriptions.push(observable.subscribe(value => secondEms.push(value)));
    service.mockedHttpClient.emit(returnValue);
    expect(loading).toEqual(false);
    expect(emissions).toEqual(firstEmptyThenResult);
    expect(secondEms).toEqual(firstEmptyThenResult);
    expect(service.mockedHttpClient.callCount).toBe(1);
  });

  it('should share two simultaneous subscriptions to different observables', () => {
    subscriptions.push(service.getTestEntities().subscribe(value => emissions.push(value)));
    subscriptions.push(service.getTestEntities().subscribe(value => secondEms.push(value)));
    service.mockedHttpClient.emit(returnValue);
    expect(loading).toEqual(false);
    expect(emissions).toEqual(firstEmptyThenResult);
    expect(secondEms).toEqual(firstEmptyThenResult);
    expect(service.mockedHttpClient.callCount).toBe(1);
  });

  it('should share a second call to the same observable after it has completed', () => {
    const observable = service.getTestEntities();
    subscriptions.push(observable.subscribe(value => emissions.push(value)));
    service.mockedHttpClient.emit(returnValue);
    subscriptions.push(observable.subscribe(value => secondEms.push(value)));
    expect(loading).toEqual(false);
    expect(emissions).toEqual(firstEmptyThenResult);
    expect(secondEms).toEqual(immediateResult);
    expect(service.mockedHttpClient.callCount).toBe(1);
  });

  it('should share a second call to a different observable after it has completed', () => {
    subscriptions.push(service.getTestEntities().subscribe(value => emissions.push(value)));
    service.mockedHttpClient.emit(returnValue);
    subscriptions.push(service.getTestEntities().subscribe(value => secondEms.push(value)));
    expect(loading).toEqual(false);
    expect(emissions).toEqual(firstEmptyThenResult);
    expect(secondEms).toEqual(immediateResult);
    expect(service.mockedHttpClient.callCount).toBe(1);
  });

  it('should share a second call to a different observable after it was unsubscribed', () => {
    const subscription = service.getTestEntities().subscribe(value => emissions.push(value));
    service.mockedHttpClient.emit(returnValue);
    subscription.unsubscribe();
    subscriptions.push(service.getTestEntities().subscribe(value => secondEms.push(value)));
    expect(loading).toEqual(false);
    expect(emissions).toEqual(firstEmptyThenResult);
    expect(secondEms).toEqual(immediateResult);
    expect(service.mockedHttpClient.callCount).toBe(1);
  });

  afterEach(() => {
    subscriptions.forEach(subscription => subscription.unsubscribe());
    service.mockedHttpClient.terminate();
  });
});
