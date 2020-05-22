import {Injectable} from '@angular/core';
import {combineLatest, concat, Observable, of} from 'rxjs';
import {Film} from '../model/film';
import {Character} from '../model/character';
import {map, shareReplay, switchMap} from 'rxjs/operators';
import {Api} from './api';
import {State} from '../state-helpers/state';
import {resource} from '../state-helpers/resources';
import {WithLoadingIndicator} from '../state-helpers/with-loading-indicator';

@Injectable({
  providedIn: 'root'
})
export class SelectionState extends State<{
  selectedFilmId: string,
  selectedCharacterId: string
}> {

  private films = resource(() => this.api.getFilms());
  private charactersForSelectedFilm = resource(film =>
      film && film.characters.length > 0 ?
        combineLatest(film.characters.map(characterUrl => this.api.getCharacter(characterUrl))) :
        of([]),
    this.getSelectedFilm()
  );

  constructor(private api: Api) {
    super();
  }

  getFilms(): Observable<WithLoadingIndicator<Film[]>> {
    return this.films.get();
  }

  getCharactersForSelectedFilm(): Observable<WithLoadingIndicator<Character[]>> {
    return this.charactersForSelectedFilm.get();
  }

  getSelectedFilm() {
    return this.getSelected(this.getFilms(), this.get('selectedFilmId'));
  }

  getSelectedCharacter() {
    return this.getSelected(this.getCharactersForSelectedFilm(), this.get('selectedCharacterId'));
  }

  private getSelected<T extends { url: string }>(
    listObs: Observable<WithLoadingIndicator<T[]>>, idObs: Observable<string>): Observable<T | undefined> {
    return combineLatest([listObs, idObs]).pipe(
      map(([list, id]) => list.data && list.data.find(film => film.url === id)));
  }
}
