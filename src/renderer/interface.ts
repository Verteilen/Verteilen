export * from 'verteilen-core/src/interface'
export * from 'verteilen-core/src/server'
export type LooseRequired<T> = {
    [P in keyof (T & Required<T>)]: T[P];
}