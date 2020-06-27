import {TestBed} from '@angular/core/testing';

import {EntityService} from './entity.service';
import {Injectable} from '@angular/core';
import {EntityState, EntityStore, getEntityType, QueryEntity, StoreConfig} from '@datorama/akita';
import {Observable, Subject, Subscription} from 'rxjs';
import {take, tap} from 'rxjs/operators';
import {Mock} from 'protractor/built/driverProviders';
import {HttpClientMock} from './http-client-mock';
import {TestEntity} from './test-entity';
import {TestEntityService} from './test-entity-service';

describe('EntityService expire cache', () => {

  const firstResult = [{id: 1}, {id: 2}];
  const secondResult = [{id: 3}, {id: 4}];
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
