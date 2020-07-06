import {Injectable} from '@angular/core';
import {Api} from './api';
import {ActiveState, EntityState, EntityStore, QueryEntity, StoreConfig} from '@datorama/akita';
import {Film} from '../model/film';
import {Observable} from 'rxjs';
import {load} from '../endpoint/load';
import {AkitaAllEntitiesCache} from '../endpoint/akita-all-entities-cache';

interface FilmsState extends EntityState<Film, string>, ActiveState {

  selectedFilmId: string;

}

@Injectable({providedIn: 'root'})
@StoreConfig({name: 'films', idKey: 'url'})
class FilmsStore extends EntityStore<FilmsState> {

  constructor() {
    super();
  }
}

@Injectable({providedIn: 'root'})
export class FilmsService {

  private readonly query: QueryEntity<FilmsState>;
  private readonly cache: AkitaAllEntitiesCache<FilmsState>;

  constructor(
    private filmsStore: FilmsStore,
    private api: Api
  ) {
    this.query = new QueryEntity(filmsStore);
    this.cache = new AkitaAllEntitiesCache(filmsStore, this.query);
  }

  get films(): Observable<Film[]> {
    return load(() => this.api.getFilms(), this.cache);
  }

  get selectedFilm(): Observable<Film> {
    return this.query.selectActive();
  }

  get loading(): Observable<boolean> {
    return this.cache.isLoading();
  }

  setSelectedFilm(selectedFilmId: string) {
    this.filmsStore.setActive(selectedFilmId);
  }
}
