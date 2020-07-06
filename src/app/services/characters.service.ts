import {EntityState, EntityStore, QueryEntity, StoreConfig} from '@datorama/akita';
import {Character} from '../model/character';
import {Api} from './api';
import {FilmsService} from './films.service';
import {Injectable} from '@angular/core';
import {filter, map, shareReplay, switchMap} from 'rxjs/operators';
import {combineLatest, concat, Observable, of} from 'rxjs';
import {produce} from 'immer';
import {load} from '../endpoint/load';
import {ResourceCache} from '../endpoint/resource-cache';

interface Cached<T> {
  id: string;
  data: T;
  timestamp: number;
  loading: boolean;
}

interface CharactersState extends EntityState<Cached<Character>, string> {
  selectedId: string;
}

@Injectable({providedIn: 'root'})
@StoreConfig({name: 'characters', idKey: 'id', producerFn: produce})
class CharactersStore extends EntityStore<CharactersState> {

  constructor() {
    super();
  }
}

@Injectable({providedIn: 'root'})
export class CharactersService {

  private query: QueryEntity<CharactersState>;

  constructor(
    private charactersStore: CharactersStore,
    private filmsService: FilmsService,
    private api: Api
  ) {
    this.query = new QueryEntity(this.charactersStore);
  }

  get charactersForSelectedFilm() {
    return this.filmsService.selectedFilm.pipe(
      switchMap(film => concat(
        of([]),
        film && film.characters.length > 0 ?
          combineLatest(film.characters.map(characterUrl => this.getCharacter(characterUrl))) :
          of([] as Character[])
      )),
      shareReplay()
    );
  }

  get selectedCharacter() {
    return combineLatest([
      this.charactersForSelectedFilm,
      this.query.select('selectedId')
    ]).pipe(
      map(([characters, selectedId]) => characters.find(character => character.url === selectedId)),
      shareReplay()
    );
  }

  getCharacter(id: string): Observable<Character> {
    return load(() => this.api.getCharacter(id), this.cache(id));
  }

  setSelectedCharacter(selectedCharacterId: string) {
    this.charactersStore.update(state => {
      state.selectedId = selectedCharacterId;
    });
  }

  get loading(): Observable<boolean> {
    return this.query.selectAll().pipe(map(all => all.some(item => item.loading)));
  }

  private cache(id: string): ResourceCache<Character> {
    const self = this;
    const entity = self.query.selectEntity(id);
    return {
      getCachedData(): Observable<Character> {
        return entity.pipe(map(cachedEntity => cachedEntity && cachedEntity.data), filter(data => !!data));
      }, setCachedData(data: Character): void {
        self.charactersStore.upsert(id, {
          id,
          data,
          loading: false,
          timestamp: Date.now()
        });
      }, hasCache(): Observable<boolean> {
        return entity.pipe(
          map(cachedEntity => cachedEntity && cachedEntity.timestamp &&
            (!self.charactersStore.cacheConfig || !self.charactersStore.cacheConfig.ttl ||
              (cachedEntity.timestamp - Date.now() < self.charactersStore.cacheConfig.ttl)))
        );
      }, isLoading(): Observable<boolean> {
        return entity.pipe(map(cachedEntity => cachedEntity && cachedEntity.loading));
      }, setHasCache(hasCache: boolean): void {
        if (hasCache) {
          self.charactersStore.upsert(id, {timestamp: Date.now()});
        } else {
          self.charactersStore.upsert(id, {timestamp: undefined});
        }
      }, setLoading(loading: boolean): void {
        self.charactersStore.upsert(id, {loading});
      }
    };
  }
}
