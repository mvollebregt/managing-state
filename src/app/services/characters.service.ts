import {ActiveState, cacheable, EntityState, EntityStore, EntityUIQuery, QueryEntity, StoreConfig} from '@datorama/akita';
import {Film} from '../model/film';
import {Character} from '../model/character';
import {Api} from './api';
import {FilmsService} from './films.service';
import {Injectable} from '@angular/core';
import {shareReplay, switchMap, tap} from 'rxjs/operators';
import {combineLatest, of} from 'rxjs';
import {StoreService} from '../state-helpers/store.service';

interface CharactersState extends EntityState<Character, string>, ActiveState {
}

@Injectable({providedIn: 'root'})
@StoreConfig({name: 'characters', idKey: 'url'})
class CharactersStore extends EntityStore<CharactersState> {

  constructor() {
    super();
  }
}

@Injectable({providedIn: 'root'})
export class CharactersService extends StoreService<CharactersState> {

  constructor(
    private charactersStore: CharactersStore,
    private filmsService: FilmsService,
    private api: Api
  ) {
    super(charactersStore);
  }

  readonly charactersForSelectedFilm = this.load(
    (film: Film) => film && film.characters.length > 0 ?
      combineLatest(film.characters.map(characterUrl =>
        this.query.hasEntity(characterUrl) ?
          of(this.query.getEntity(characterUrl)) :
          this.api.getCharacter(characterUrl))) :
      of([] as Character[]),
    this.filmsService.selectedFilm
  );

  readonly selectedCharacter = this.query.selectActive();

  readonly loading = this.query.selectLoading();

  setSelectedCharacter(selectedCharacterId: string) {
    this.charactersStore.setActive(selectedCharacterId);
  }
}
