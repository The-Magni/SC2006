export class TrainStation {
  name: string
  code: string

  constructor(name: string, code: string) {
    this.name = name
    this.code = code
  }

  get getName(): string {
    return `${this.name}`
  }
  get getCode(): string {
    return `${this.code}`
  }
}
