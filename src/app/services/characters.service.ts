import {ActiveState, cacheable, EntityState, EntityStore, EntityUIQuery, QueryEntity, StoreConfig} from '@datorama/akita';
import {Film} from '../model/film';
import {Character} from '../model/character';
import {Api} from './api';
import {FilmsService} from './films.service';
import {Injectable} from '@angular/core';
import {map, shareReplay, switchMap, switchMapTo, tap} from 'rxjs/operators';
import {combineLatest, concat, Observable, of} from 'rxjs';
import {StoreService} from '../state-helpers/store.service';
import {produce} from 'immer';

interface CharactersState extends EntityState<Character, string> {
  loadingItems: number;
  selectedId: string;
}

@Injectable({providedIn: 'root'})
@StoreConfig({name: 'characters', idKey: 'url', producerFn: produce})
class CharactersStore extends EntityStore<CharactersState> {

  constructor() {
    super({
      loadingItems: 0
    });
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

  readonly charactersForSelectedFilm =
    this.filmsService.selectedFilm.pipe(
      switchMap(film => concat(
        of([]),
        film && film.characters.length > 0 ?
          combineLatest(film.characters.map(characterUrl => this.getCharacter(characterUrl))) :
          of([] as Character[])
      )),
      shareReplay()
    );

  readonly selectedCharacter = combineLatest([
    this.charactersForSelectedFilm,
    this.query.select('selectedId')
  ]).pipe(
    map(([characters, selectedId]) => characters.find(character => character.url === selectedId)),
    shareReplay()
  );

  readonly loading = this.query.select('loadingItems').pipe(map(num => num >= 1));

  getCharacter(id: string): Observable<Character> {
    if (this.query.hasEntity(id)) {
      return this.query.selectEntity(id);
    } else {
      this.store.update(state => {
        state.loadingItems++;
      });
      return this.api.getCharacter(id).pipe(
        tap(character => {
          this.store.add(character);
          this.store.update(state => {
            state.loadingItems--;
          });
        }),
        switchMapTo(this.query.selectEntity(id))
      );
    }
  }

  setSelectedCharacter(selectedCharacterId: string) {
    this.charactersStore.update(state => { state.selectedId = selectedCharacterId; } );
  }
}
