import {TestBed} from '@angular/core/testing';

import {Observable, Subscription} from 'rxjs';
import {TestEntity} from './test-entity';
import {TestEntityService} from './test-entity-service';

describe('EntityService simple load', () => {

  const returnValue = [{id: 1}, {id: 2}];
  const immediateResult = [returnValue];
  const firstEmptyThenResult = [[], returnValue];

  const subscriptions: Subscription[] = [];

  let emissions: TestEntity[][];
  let secondEms: TestEntity[][];
  let loading: boolean | undefined;
  let service: TestEntityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TestEntityService);
    subscriptions.push(service.loading.subscribe(value => loading = value));
    emissions = [];
    secondEms = [];
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.query).toBeTruthy();
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

  function testSimultaneousSubscriptions(first: Observable<TestEntity[]>, second: Observable<TestEntity[]>) {
    subscriptions.push(first.subscribe(value => emissions.push(value)));
    subscriptions.push(second.subscribe(value => secondEms.push(value)));
    service.mockedHttpClient.emit(returnValue);
    expect(loading).toEqual(false);
    expect(emissions).toEqual(firstEmptyThenResult);
    expect(secondEms).toEqual(firstEmptyThenResult);
    expect(service.mockedHttpClient.callCount).toBe(1);
  }

  it('should share two simultaneous subscriptions to the same observable', () => {
    const observable = service.getTestEntities();
    testSimultaneousSubscriptions(observable, observable);
  });

  it('should share two simultaneous subscriptions to different observables', () => {
    testSimultaneousSubscriptions(service.getTestEntities(), service.getTestEntities());
  });

  function testSubsequentSubscriptions(first: Observable<TestEntity[]>, second: Observable<TestEntity[]>) {
    subscriptions.push(first.subscribe(value => emissions.push(value)));
    service.mockedHttpClient.emit(returnValue);
    subscriptions.push(second.subscribe(value => secondEms.push(value)));
    expect(loading).toEqual(false);
    expect(emissions).toEqual(firstEmptyThenResult);
    expect(secondEms).toEqual(immediateResult);
    expect(service.mockedHttpClient.callCount).toBe(1);
  }

  it('should share a second call to the same observable after it has completed', () => {
    const observable = service.getTestEntities();
    testSubsequentSubscriptions(observable, observable);
  });

  it('should share a second call to a different observable after it has completed', () => {
    testSubsequentSubscriptions(service.getTestEntities(), service.getTestEntities());
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
