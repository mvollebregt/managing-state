import {Observable, Subject} from 'rxjs';
import {take} from 'rxjs/operators';

export class HttpClientMock<T> {

  callCount = 0;

  private emissions = new Subject<T>();

  emit(response: T) {
    this.emissions.next(response);
  }

  terminate() {
    this.emissions.complete();
  }

  get(): Observable<T> {
    return new Observable(subscriber => {
        this.callCount++;
        this.emissions.pipe(take(1)).subscribe(subscriber);
      }
    );
  }
}
