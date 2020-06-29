import {HttpEndpointCache} from './http-endpoint-cache';
import {Observable} from 'rxjs';
import {load} from './load';
import {HttpClient} from '@angular/common/http';

export abstract class HttpEndpoint<T> {

  constructor(private http: HttpClient,
              private baseUrl: string,
              private cache: HttpEndpointCache<T>) {
  }

  getAll(): Observable<T[]> {
    return load(() => this.http.get<T[]>(this.baseUrl), this.cache.allEntitiesCache);
  }

  isLoading(): Observable<boolean> {
    return this.cache.loading;
  }

  expireCache() {
    this.cache.expire();
  }
}
