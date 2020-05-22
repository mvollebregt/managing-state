export interface WithLoadingIndicator<T> {
  loading: boolean;
  data: T | undefined;
}
