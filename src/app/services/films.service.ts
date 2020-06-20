import {Injectable} from '@angular/core';
import {Api} from './api';
import {ActiveState, cacheable, EntityState, EntityStore, Query, QueryEntity, Store, StoreConfig} from '@datorama/akita';
import {shareReplay, tap} from 'rxjs/operators';
import {Film} from '../model/film';
import {StoreService} from '../state-helpers/store.service';
import {concat, of} from 'rxjs';

interface FilmsState extends EntityState<Film, string>, ActiveState {
}

@Injectable({providedIn: 'root'})
@StoreConfig({name: 'films', idKey: 'url'})
class FilmsStore extends EntityStore<FilmsState> {

  constructor() {
    super();
  }
}

@Injectable({providedIn: 'root'})
export class FilmsService extends StoreService<FilmsState> {

  constructor(
    private filmsStore: FilmsStore,
    private api: Api
  ) {
    super(filmsStore);
  }

  readonly films = this.load(() => this.api.getFilms());

  readonly selectedFilm = this.query.selectActive();

  setSelectedFilm(selectedFilmId: string) {
    this.filmsStore.setActive(selectedFilmId);
  }
}
