import {BehaviorSubject, concat, Observable, of} from 'rxjs';
import {distinctUntilChanged, map, shareReplay, tap} from 'rxjs/operators';

export abstract class State<T> {

  private stateSubject = new BehaviorSubject<T>({} as T);

  // TODO: combined get
  get(property: keyof T) {
    return this.stateSubject.pipe(
      map(state => state[property]),
      distinctUntilChanged()
    );
  }

  patch(changes: Partial<T>) {
    this.stateSubject.next({...this.stateSubject.value, ...changes});
  }
}
