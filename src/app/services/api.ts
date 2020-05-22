import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Film} from '../model/film';
import {Character} from '../model/character';
import {map, tap} from 'rxjs/operators';
import {ApiResponse} from '../model/api-response';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Api {

  constructor(private http: HttpClient) {
  }

  getFilms(): Observable<Film[]> {
    return this.http.get<ApiResponse<Film>>('https://swapi.dev/api/films').pipe(
      map(response => response.results)
    );
  }

  getCharacter(url: string): Observable<Character> {
    return this.http.get<Character>(url);
  }
}
