export class JacksonStore {
  constructor(
    public key: string,
    public value: string,
    public iv?: string,
    public tag?: string
  ) {}
}
