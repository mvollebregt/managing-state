import {TestBed} from '@angular/core/testing';
import {Observable, Subscription} from 'rxjs';
import {TestEntity} from './test-entity';
import {TestEntityService} from './test-entity-service';

describe('EntityService expire cache', () => {

  const firstResult = [{id: 1}, {id: 2}];
  const secondResult = [{id: 3}, {id: 4}];
  const immediateResult = [firstResult];
  const firstEmptyThenResult = [[], firstResult];
  const firstEmptyThenTwoResults = [[], firstResult, secondResult];

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

  function testSubscribeSecondAfterExpire(first: Observable<TestEntity[]>, second: Observable<TestEntity[]>) {
    subscriptions.push(first.subscribe(value => emissions.push(value)));
    service.mockedHttpClient.emit(firstResult);
    service.expireCache();
    subscriptions.push(second.subscribe(value => secondEms.push(value)));
    // before second emission:
    expect(loading).toEqual(true);
    expect(emissions).toEqual(firstEmptyThenResult); // no changes yet
    expect(secondEms).toEqual(immediateResult);
    // after second emission:
    service.mockedHttpClient.emit(secondResult);
    expect(loading).toEqual(false);
    expect(emissions).toEqual(firstEmptyThenTwoResults);
    expect(secondEms).toEqual([firstResult, secondResult]);
    expect(service.mockedHttpClient.callCount).toBe(2);
  }

  it('should cause a second http call if the same observable is subscribed after the cache has expired', () => {
    const observable = service.getTestEntities();
    testSubscribeSecondAfterExpire(observable, observable);
  });


  it('should cause a second http call if another observable is subscribed after the cache has expired', () => {
    testSubscribeSecondAfterExpire(service.getTestEntities(), service.getTestEntities());
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
    expect(secondEms).toEqual(immediateResult);
    // after second emission:
    service.mockedHttpClient.emit(secondResult);
    expect(loading).toEqual(false);
    expect(emissions).toEqual(firstEmptyThenResult); // did not change
    expect(secondEms).toEqual([firstResult, secondResult]);
    expect(service.mockedHttpClient.callCount).toBe(2);
  });

  function testSecondStillGetsUpdateAfterFirstIsUnsubscribed(firstSubscription: Subscription, secondSubscription: Subscription) {
    service.mockedHttpClient.emit(firstResult);
    service.expireCache();
    firstSubscription.unsubscribe();
    // third subscribe should also cause refresh of second observable
    subscriptions.push(service.getTestEntities().subscribe());
    service.mockedHttpClient.emit(secondResult);
    expect(loading).toEqual(false);
    expect(emissions).toEqual(firstEmptyThenResult);
    expect(secondEms).toEqual(firstEmptyThenTwoResults);
    expect(service.mockedHttpClient.callCount).toBe(2);
    // tear down
    secondSubscription.unsubscribe();
  }

  it('should still cause a refresh of the second observable if the first observable is unsubscribed', () => {
    const firstSubscription = service.getTestEntities().subscribe(value => emissions.push(value));
    const secondSubscription = service.getTestEntities().subscribe(value => secondEms.push(value));
    testSecondStillGetsUpdateAfterFirstIsUnsubscribed(firstSubscription, secondSubscription);
  });

  it('should still cause a refresh of the second observable if the first observable is unsubscribed', () => {
    // reverse order and reuse Observable -> should still have the same effect
    const observable = service.getTestEntities();
    const secondSubscription = observable.subscribe(value => secondEms.push(value));
    const firstSubscription = observable.subscribe(value => emissions.push(value));
    testSecondStillGetsUpdateAfterFirstIsUnsubscribed(firstSubscription, secondSubscription);
  });

  afterEach(() => {
    subscriptions.forEach(subscription => subscription.unsubscribe());
    service.mockedHttpClient.terminate();
  });
});
