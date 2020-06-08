import { Component } from '@angular/core';
import {Observable} from 'rxjs';
import {Film} from './model/film';
import {Character} from './model/character';
import {FormControl} from '@angular/forms';
import {FilmsService} from './services/films.service';
import {CharactersService} from './services/characters.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {

  films: Observable<Film[]>;
  characters: Observable<Character[]>;
  loadingFilms: Observable<boolean>;
  loadingCharacters: Observable<boolean>;
  selectedFilm: Observable<Film>;
  selectedCharacter: Observable<Character>;
  filmControl = new FormControl();
  characterControl = new FormControl();

  constructor(
    filmsService: FilmsService,
    charactersService: CharactersService
    ) {
    this.films = filmsService.films;
    this.characters = charactersService.charactersForSelectedFilm;
    this.loadingFilms = filmsService.loading;
    this.loadingCharacters = charactersService.loading;
    this.selectedFilm = filmsService.selectedFilm;
    this.selectedCharacter = charactersService.selectedCharacter;
    this.filmControl.valueChanges.subscribe(selectedFilmId => filmsService.setSelectedFilm(selectedFilmId));
    this.characterControl.valueChanges.subscribe(selectedCharacterId => charactersService.setSelectedCharacter(selectedCharacterId));
  }

}
