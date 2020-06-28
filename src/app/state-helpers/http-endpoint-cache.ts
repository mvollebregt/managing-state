import {ResourceCache} from './resource-cache';

export interface HttpEndpointCache<T> {

  allEntitiesCache: ResourceCache<T[]>;

}
