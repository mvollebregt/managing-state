import {TestBed} from '@angular/core/testing';
import {Observable, Subscription} from 'rxjs';
import {TestEntity} from './test-entity';
import {TestEntityHttpEndpoint} from './test-entity-http-endpoint';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';

describe('HttpEndpoint.expireCache()', () => {

  const firstResult = [{id: 1}, {id: 2}];
  const secondResult = [{id: 3}, {id: 4}];
  const immediateResult = [firstResult];
  const firstEmptyThenResult = [[], firstResult];
  const firstEmptyThenTwoResults = [[], firstResult, secondResult];

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

  function testSubscribeSecondAfterExpire(first: Observable<TestEntity[]>, second: Observable<TestEntity[]>) {
    subscriptions.push(first.subscribe(value => emissions.push(value)));
    const request1 = httpTestingController.expectOne('baseUrl');
    request1.flush(firstResult);
    endpoint.expireCache();
    subscriptions.push(second.subscribe(value => secondEms.push(value)));
    // before second emission:
    const request2 = httpTestingController.expectOne('baseUrl');
    expect(loading).toEqual(true);
    expect(emissions).toEqual(firstEmptyThenResult); // no changes yet
    expect(secondEms).toEqual(immediateResult);
    // after second emission:
    request2.flush(secondResult);
    expect(loading).toEqual(false);
    expect(emissions).toEqual(firstEmptyThenTwoResults);
    expect(secondEms).toEqual([firstResult, secondResult]);
    httpTestingController.verify();
  }

  it('should cause a second http call if the same observable is subscribed after the cache has expired', () => {
    const observable = endpoint.getAll();
    testSubscribeSecondAfterExpire(observable, observable);
  });


  it('should cause a second http call if another observable is subscribed after the cache has expired', () => {
    testSubscribeSecondAfterExpire(endpoint.getAll(), endpoint.getAll());
  });

  it('should cause a new http call if another observable was already unsubscribed and the cache was expired', () => {
    const subscription = endpoint.getAll().subscribe(value => emissions.push(value));
    const request1 = httpTestingController.expectOne('baseUrl');
    request1.flush(firstResult);
    subscription.unsubscribe();
    endpoint.expireCache();
    subscriptions.push(endpoint.getAll().subscribe(value => secondEms.push(value)));
    // before second emission:
    const request2 = httpTestingController.expectOne('baseUrl');
    expect(loading).toEqual(true);
    expect(emissions).toEqual(firstEmptyThenResult);
    expect(secondEms).toEqual(immediateResult);
    // after second emission:
    request2.flush(secondResult);
    expect(loading).toEqual(false);
    expect(emissions).toEqual(firstEmptyThenResult); // did not change
    expect(secondEms).toEqual([firstResult, secondResult]);
    httpTestingController.verify();
  });

  function testSecondStillGetsUpdateAfterFirstIsUnsubscribed(firstSubscription: Subscription, secondSubscription: Subscription) {
    const request1 = httpTestingController.expectOne('baseUrl');
    request1.flush(firstResult);
    endpoint.expireCache();
    firstSubscription.unsubscribe();
    // third subscribe should also cause refresh of second observable
    subscriptions.push(endpoint.getAll().subscribe());
    const request2 = httpTestingController.expectOne('baseUrl');
    request2.flush(secondResult);
    expect(loading).toEqual(false);
    expect(emissions).toEqual(firstEmptyThenResult);
    expect(secondEms).toEqual(firstEmptyThenTwoResults);
    httpTestingController.verify();
    // tear down
    secondSubscription.unsubscribe();
  }

  it('should still cause a refresh of the second observable if the first observable is unsubscribed', () => {
    const firstSubscription = endpoint.getAll().subscribe(value => emissions.push(value));
    const secondSubscription = endpoint.getAll().subscribe(value => secondEms.push(value));
    testSecondStillGetsUpdateAfterFirstIsUnsubscribed(firstSubscription, secondSubscription);
  });

  it('should still cause a refresh of the second observable if the first observable is unsubscribed', () => {
    // reverse order and reuse Observable -> should still have the same effect
    const observable = endpoint.getAll();
    const secondSubscription = observable.subscribe(value => secondEms.push(value));
    const firstSubscription = observable.subscribe(value => emissions.push(value));
    testSecondStillGetsUpdateAfterFirstIsUnsubscribed(firstSubscription, secondSubscription);
  });

  afterEach(() => {
    subscriptions.forEach(subscription => subscription.unsubscribe());
  });
});
