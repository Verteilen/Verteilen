export * from 'verteilen-core/src/interface'
export type LooseRequired<T> = {
    [P in keyof (T & Required<T>)]: T[P];
}