export interface WithLoadingIndicator<T> {
  ___loading: boolean;
  data: T | undefined;
}
