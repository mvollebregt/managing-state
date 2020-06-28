import {Observable} from 'rxjs';

export interface ResourceCache<R> {

  /**
   * Gets the data object from the cache.
   */
  getCachedData(): Observable<R>;

  /**
   * Sets the data object in the cache. Sets loading to false. Sets the timestamp for caching.
   */
  setCachedData(data: R): void;

  /**
   * Gets the loading indicator.
   */
  isLoading(): Observable<boolean>;

  /**
   * Sets the loading indicator.
   */
  setLoading(loading: boolean): void;

  /**
   * Gets an indicator of the validity of the cache.
   */
  hasCache(): Observable<boolean>;

  /**
   * Sets the validity of the cache.
   */
  setHasCache(hasCache: boolean): void;
}
