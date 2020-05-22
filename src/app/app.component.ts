import { Component } from '@angular/core';
import {Observable} from 'rxjs';
import {Film} from './model/film';
import {Character} from './model/character';
import {FormControl} from '@angular/forms';
import {SelectionState} from './services/selection-state';
import {WithLoadingIndicator} from './state-helpers/with-loading-indicator';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {

  films: Observable<WithLoadingIndicator<Film[]>>;
  characters: Observable<WithLoadingIndicator<Character[]>>;
  selectedFilm: Observable<Film>;
  selectedCharacter: Observable<Character>;
  filmControl = new FormControl();
  characterControl = new FormControl();

  constructor(state: SelectionState) {
    this.films = state.getFilms();
    this.characters = state.getCharactersForSelectedFilm();
    this.selectedFilm = state.getSelectedFilm();
    this.selectedCharacter = state.getSelectedCharacter();
    this.filmControl.valueChanges.subscribe(filmId => state.patch({selectedFilmId: filmId}));
    this.characterControl.valueChanges.subscribe(characterId => state.patch({selectedCharacterId: characterId}));
  }

}
