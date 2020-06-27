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

describe('EntityService expire cache', () => {

  const firstResult = [{id: 1}, {id: 2}];
  const secondResult = [{id: 3}, {id: 4}];
  const firstEmptyThenResult = [[], firstResult];
  const firstEmptyThenTwoResults = [[], firstResult, secondResult];
  const immediateResult = [firstResult];

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

  it('should cause a second http call if the same observable is subscribed after the cache has expired', () => {
    const observable = service.getTestEntities();
    subscriptions.push(observable.subscribe(value => emissions.push(value)));
    service.mockedHttpClient.emit(firstResult);
    service.expireCache();
    // second subscribe to same observable
    subscriptions.push(observable.subscribe(value => secondEms.push(value)));
    // before second emission:
    expect(loading).toEqual(true);
    expect(emissions).toEqual(firstEmptyThenResult); // no changes yet
    expect(secondEms).toEqual([firstResult]);
    // after second emission:
    service.mockedHttpClient.emit(secondResult);
    expect(loading).toEqual(false);
    expect(emissions).toEqual(firstEmptyThenTwoResults);
    expect(secondEms).toEqual([firstResult, secondResult]);
    expect(service.mockedHttpClient.callCount).toBe(2);
  });

  it('should cause a second http call if another observable is subscribed after the cache has expired', () => {
    subscriptions.push(service.getTestEntities().subscribe(value => emissions.push(value)));
    service.mockedHttpClient.emit(firstResult);
    service.expireCache();
    // second subscribe to different observable
    subscriptions.push(service.getTestEntities().subscribe(value => secondEms.push(value)));
    // before second emission:
    expect(loading).toEqual(true);
    expect(emissions).toEqual(firstEmptyThenResult); // no changes yet
    expect(secondEms).toEqual([firstResult]);
    // after second emission:
    service.mockedHttpClient.emit(secondResult);
    expect(loading).toEqual(false);
    expect(emissions).toEqual(firstEmptyThenTwoResults);
    expect(secondEms).toEqual([firstResult, secondResult]);
    expect(service.mockedHttpClient.callCount).toBe(2);
  });

  it('should cause a new http call if another observable was already unsubscribed and the cache was expired', () => {
    const subscription = service.getTestEntities().subscribe(value => emissions.push(value));
    service.mockedHttpClient.emit(firstResult);
    subscription.unsubscribe();
    service.expireCache();
    subscriptions.push(service.getTestEntities().subscribe(value => secondEms.push(value)));
    // before second emission:
    expect(loading).toEqual(true);
    expect(emissions).toEqual(firstEmptyThenResult);
    expect(secondEms).toEqual([firstResult]);
    // after second emission:
    service.mockedHttpClient.emit(secondResult);
    expect(loading).toEqual(false);
    expect(emissions).toEqual(firstEmptyThenResult); // did not change
    expect(secondEms).toEqual([firstResult, secondResult]);
    expect(service.mockedHttpClient.callCount).toBe(2);
  });

  afterEach(() => {
    subscriptions.forEach(subscription => subscription.unsubscribe());
    service.mockedHttpClient.terminate();
  });
});
