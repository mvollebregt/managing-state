import {Injectable} from '@angular/core';
import {combineLatest, concat, Observable, of} from 'rxjs';
import {Film} from '../model/film';
import {Character} from '../model/character';
import {map, shareReplay, switchMap, tap} from 'rxjs/operators';
import {State} from './state';
import {Api} from './api';
import {WithLoadingIndicator, withLoadingIndicator} from '../state-helpers/with-loading-indicator';

@Injectable({
  providedIn: 'root'
})
export class Selectors {

  // for more caching options, including refreshing on a trigger,
  // see https://blog.thoughtram.io/angular/2018/03/05/advanced-caching-with-rxjs.html

  private films = withLoadingIndicator(this.api.getFilms());

  private charactersForSelectedFilm = this.getSelectedFilm().pipe(
    switchMap(film =>
      withLoadingIndicator(combineLatest((film ? film.characters : []).map(characterUrl => this.api.getCharacter(characterUrl)))))
  );

  // TODO: make nice syntax for caching
  // TODO: make mechanism for 'loading'

  constructor(
    private api: Api,
    private state: State) {
  }

  getFilms(): Observable<WithLoadingIndicator<Film[]>> {
    return this.films;
  }

  getCharactersForSelectedFilm(): Observable<WithLoadingIndicator<Character[]>> {
    return this.charactersForSelectedFilm;
  }

  getSelectedFilm() {
    return this.getSelected(this.getFilms(), this.state.getSelectedFilmId());
  }

  getSelectedCharacter() {
    return this.getSelected(this.getCharactersForSelectedFilm(), this.state.getSelectedCharacterId());
  }

  private getSelected<T extends { url: string }>(
    listObs: Observable<WithLoadingIndicator<T[]>>, idObs: Observable<string>): Observable<T | undefined> {
    return combineLatest([listObs, idObs]).pipe(
      map(([list, id]) => list.data && list.data.find(film => film.url === id)));
  }
}
