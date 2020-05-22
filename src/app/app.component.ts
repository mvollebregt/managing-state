import { Component } from '@angular/core';
import {Observable} from 'rxjs';
import {Film} from './model/film';
import {Character} from './model/character';
import {FormControl} from '@angular/forms';
import {Selectors} from './services/selectors';
import {State} from './services/state';
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

  constructor(selectors: Selectors, state: State) {
    this.films = selectors.getFilms();
    this.characters = selectors.getCharactersForSelectedFilm();
    this.selectedFilm = selectors.getSelectedFilm();
    this.selectedCharacter = selectors.getSelectedCharacter();
    this.filmControl.valueChanges.subscribe(filmId => state.setSelectedFilmId(filmId));
    this.characterControl.valueChanges.subscribe(characterId => state.setSelectedCharacterId(characterId));
  }

}
