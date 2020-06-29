import {ResourceCache} from './resource-cache';
import {Observable} from 'rxjs';

export interface HttpEndpointCache<T> {

  allEntitiesCache: ResourceCache<T[]>;
  loading: Observable<boolean>;

}
