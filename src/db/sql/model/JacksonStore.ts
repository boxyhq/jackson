export class JacksonStore {
  constructor(
    public key: string,
    public value: any,
    public iv: any,
    public tag: any
  ) {}
}
