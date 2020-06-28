import {HttpEndpointCache} from './http-endpoint-cache';

export abstract class HttpEndpoint<T> {

  protected abstract baseUrl: string;
  protected abstract cache: HttpEndpointCache<T>;

}
