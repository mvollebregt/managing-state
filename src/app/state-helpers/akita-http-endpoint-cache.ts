import {HttpEndpointCache} from './http-endpoint-cache';
import {AkitaAllEntitiesResourceCache} from './akita-all-entities-resource-cache';
import {EntityStore, getEntityType, QueryEntity} from '@datorama/akita';

export class AkitaHttpEndpointCache<T> implements HttpEndpointCache<getEntityType<T>> {

  constructor(private store: EntityStore<T>,
              private query = new QueryEntity(store)) {
    this.store.setLoading(false);
  }

  allEntitiesCache = new AkitaAllEntitiesResourceCache<T>(this.store, this.query);
  loading = this.query.selectLoading();

}
