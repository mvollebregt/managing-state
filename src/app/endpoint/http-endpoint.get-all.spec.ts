import {TestBed} from '@angular/core/testing';

import {Observable, Subscription} from 'rxjs';
import {TestEntity} from './test-entity';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {QueryEntity} from '@datorama/akita';
import {TestEntityHttpEndpoint, TestEntityStore} from './test-entity-http-endpoint';

describe('HttpEndpoint.getAll()', () => {

  const returnValue = [{id: 1}, {id: 2}];
  const immediateResult = [returnValue];
  const firstEmptyThenResult = [[], returnValue];

  const subscriptions: Subscription[] = [];

  let emissions: TestEntity[][];
  let secondEms: TestEntity[][];
  let loading: boolean | undefined;
  let endpoint: TestEntityHttpEndpoint;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    endpoint = TestBed.inject(TestEntityHttpEndpoint);
    subscriptions.push(endpoint.isLoading().subscribe(value => loading = value));
    emissions = [];
    secondEms = [];
  });

  it('should be created', () => {
    expect(endpoint).toBeTruthy();
    expect(loading).toBe(false);
  });

  it('should load entities', () => {
    subscriptions.push(endpoint.getAll().subscribe(value => emissions.push(value)));
    const request = httpTestingController.expectOne('baseUrl');
    expect([loading, emissions]).toEqual([true, [[]]]);
    request.flush(returnValue);
    expect([loading, emissions]).toEqual([false, firstEmptyThenResult]);
  });

  it('should put entities in the store', done => {
    const store = TestBed.inject(TestEntityStore);
    subscriptions.push(endpoint.getAll().subscribe());
    const request = httpTestingController.expectOne('baseUrl');
    request.flush(returnValue);
    subscriptions.push(new QueryEntity(store).selectAll().subscribe(allInStore => {
      expect(allInStore).toEqual(returnValue);
      done();
    }));
  });

  function testSimultaneousSubscriptions(first: Observable<TestEntity[]>, second: Observable<TestEntity[]>) {
    subscriptions.push(first.subscribe(value => emissions.push(value)));
    subscriptions.push(second.subscribe(value => secondEms.push(value)));
    const request = httpTestingController.expectOne('baseUrl');
    request.flush(returnValue);
    expect(loading).toEqual(false);
    expect(emissions).toEqual(firstEmptyThenResult);
    expect(secondEms).toEqual(firstEmptyThenResult);
    httpTestingController.verify();
  }

  it('should share two simultaneous subscriptions to the same observable', () => {
    const observable = endpoint.getAll();
    testSimultaneousSubscriptions(observable, observable);
  });

  it('should share two simultaneous subscriptions to different observables', () => {
    testSimultaneousSubscriptions(endpoint.getAll(), endpoint.getAll());
  });

  function testSubsequentSubscriptions(first: Observable<TestEntity[]>, second: Observable<TestEntity[]>) {
    subscriptions.push(first.subscribe(value => emissions.push(value)));
    const request = httpTestingController.expectOne('baseUrl');
    request.flush(returnValue);
    subscriptions.push(second.subscribe(value => secondEms.push(value)));
    expect(loading).toEqual(false);
    expect(emissions).toEqual(firstEmptyThenResult);
    expect(secondEms).toEqual(immediateResult);
    httpTestingController.verify();
  }

  it('should share a second call to the same observable after it has completed', () => {
    const observable = endpoint.getAll();
    testSubsequentSubscriptions(observable, observable);
  });

  it('should share a second call to a different observable after it has completed', () => {
    testSubsequentSubscriptions(endpoint.getAll(), endpoint.getAll());
  });

  it('should share a second call to a different observable after it was unsubscribed', () => {
    const subscription = endpoint.getAll().subscribe(value => emissions.push(value));
    const request = httpTestingController.expectOne('baseUrl');
    request.flush(returnValue);
    subscription.unsubscribe();
    subscriptions.push(endpoint.getAll().subscribe(value => secondEms.push(value)));
    expect(loading).toEqual(false);
    expect(emissions).toEqual(firstEmptyThenResult);
    expect(secondEms).toEqual(immediateResult);
    httpTestingController.verify();
  });

  afterEach(() => {
    subscriptions.forEach(subscription => subscription.unsubscribe());
  });
});
