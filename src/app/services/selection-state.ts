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
  selectedCharacterId: string,
  films: Film[],
  charactersForSelectedFilm: Character[],
  selectedFilm: Film,
  selectedCharacter: Character
}> {

  constructor(private api: Api) {
    super();
    super.createQueries(this);
  }

  films() {
    return this.api.getFilms();
  }

  charactersForSelectedFilm() {
    return this.get('selectedFilm').pipe(switchMap(film =>
      film && film.characters.length > 0 ?
        combineLatest(film.characters.map(characterUrl => this.api.getCharacter(characterUrl))) :
        of([])));
  }

  selectedFilm() {
    return this.getSelected(this.get('films'), this.get('selectedFilmId'));
  }

  selectedCharacter() {
    return this.getSelected(this.get('charactersForSelectedFilm'), this.get('selectedCharacterId'));
  }

  private getSelected<T extends { url: string }>(
    listObs: Observable<T[]>, idObs: Observable<string>): Observable<T | undefined> {
    return combineLatest([listObs, idObs]).pipe(
      map(([list, id]) => list && list.find(film => film.url === id)));
  }
}
