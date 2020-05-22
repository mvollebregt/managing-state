import {Injectable} from '@angular/core';
import {Observable, ReplaySubject, Subject} from 'rxjs';
import {tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class State {

  // TODO: make nice syntax for state

  private selectedFilmId = new ReplaySubject<string>(1);
  private selectedCharacterId = new ReplaySubject<string>(1);

  getSelectedFilmId(): Observable<string> {
    return this.selectedFilmId.asObservable();
  }

  setSelectedFilmId(filmId: string) {
    this.selectedFilmId.next(filmId);
  }

  getSelectedCharacterId(): Observable<string> {
    return this.selectedCharacterId.asObservable();
  }

  setSelectedCharacterId(characterId: string) {
    this.selectedCharacterId.next(characterId);
  }
}
