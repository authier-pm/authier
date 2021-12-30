export class ConstructorAssigner<T = any> {
  constructor(parameters: Partial<T>) {
    Object.assign(this, parameters)
  }
}
