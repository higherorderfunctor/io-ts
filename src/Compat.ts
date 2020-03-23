/**
 * Missing
 *   - `pipe` method
 *   - `null` primitive
 *   - `undefined` primitive
 *   - `void` primitive
 *   - `unknown` primitive
 * @since 3.0.0
 */
import * as C from './Codec'
import * as D from './Decoder'
import * as G from './Guard'
import { Literal } from './Literal'
import * as S from './Schemable'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

/**
 * Laws: same as `Codec`
 *
 * @since 3.0.0
 */
export interface Compat<A> extends C.Codec<A>, G.Guard<A> {}

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

/**
 * @since 3.0.0
 */
export function make<A>(codec: C.Codec<A>, guard: G.Guard<A>): Compat<A> {
  return {
    is: guard.is,
    decode: codec.decode,
    encode: codec.encode
  }
}

/**
 * @since 3.0.0
 */
export function literal<A extends ReadonlyArray<Literal>>(...values: A): Compat<A[number]> {
  return make(C.codec.literal(...values), G.guard.literal(...values))
}

// -------------------------------------------------------------------------------------
// primitives
// -------------------------------------------------------------------------------------

/**
 * @since 3.0.0
 */
export const string: Compat<string> = make(C.codec.string, G.guard.string)

/**
 * @since 3.0.0
 */
export const number: Compat<number> = make(C.codec.number, G.guard.number)

/**
 * @since 3.0.0
 */
export const boolean: Compat<boolean> = make(C.codec.boolean, G.guard.boolean)

/**
 * @since 3.0.0
 */
export const UnknownArray: Compat<Array<unknown>> = make(C.codec.UnknownArray, G.guard.UnknownArray)

/**
 * @since 3.0.0
 */
export const UnknownRecord: Compat<Record<string, unknown>> = make(C.codec.UnknownRecord, G.guard.UnknownRecord)

// -------------------------------------------------------------------------------------
// combinators
// -------------------------------------------------------------------------------------

/**
 * @since 3.0.0
 */
export function refinement<A, B extends A>(from: Compat<A>, refinement: (a: A) => a is B, expected: string): Compat<B> {
  return make(C.refinement(from, refinement, expected), G.refinement(from, refinement))
}

/**
 * @since 3.0.0
 */
export function nullable<A>(or: Compat<A>): Compat<null | A> {
  return make(C.codec.nullable(or), G.guard.nullable(or))
}

/**
 * @since 3.0.0
 */
export function type<A>(properties: { [K in keyof A]: Compat<A[K]> }): Compat<A> {
  return make(C.codec.type(properties), G.guard.type(properties))
}

/**
 * @since 3.0.0
 */
export function partial<A>(properties: { [K in keyof A]: Compat<A[K]> }): Compat<Partial<A>> {
  return make(C.codec.partial(properties), G.guard.partial(properties))
}

/**
 * @since 3.0.0
 */
export function record<A>(codomain: Compat<A>): Compat<Record<string, A>> {
  return make(C.codec.record(codomain), G.guard.record(codomain))
}

/**
 * @since 3.0.0
 */
export function array<A>(items: Compat<A>): Compat<Array<A>> {
  return make(C.codec.array(items), G.guard.array(items))
}

/**
 * @since 3.0.0
 */
export function tuple<A extends ReadonlyArray<unknown>>(...components: { [K in keyof A]: Compat<A[K]> }): Compat<A> {
  return make(C.codec.tuple<A>(...(components as any)), G.guard.tuple<A>(...(components as any)))
}

/**
 * @since 3.0.0
 */
export function intersection<A, B>(left: Compat<A>, right: Compat<B>): Compat<A & B> {
  return make(C.codec.intersection(left, right), G.guard.intersection(left, right))
}

/**
 * @since 3.0.0
 */
export function union<A extends ReadonlyArray<unknown>>(
  ...members: { [K in keyof A]: Compat<A[K]> }
): Compat<A[number]> {
  return {
    is: G.guard.union(...members).is,
    decode: D.decoder.union(...members).decode,
    encode: a => {
      for (const member of members) {
        if (member.is(a)) {
          return member.encode(a)
        }
      }
    }
  }
}

/**
 * @since 3.0.0
 */
export function sum<T extends string>(
  tag: T
): <A>(members: { [K in keyof A]: Compat<A[K] & Record<T, K>> }) => Compat<A[keyof A]> {
  const sumC = C.codec.sum(tag)
  const sumG = G.guard.sum(tag)
  return members => make(sumC(members), sumG(members))
}

/**
 * @since 3.0.0
 */
export function lazy<A>(id: string, f: () => Compat<A>): Compat<A> {
  return make(C.codec.lazy(id, f), G.guard.lazy(id, f))
}

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

/**
 * @since 3.0.0
 */
export const URI = 'Compat'

/**
 * @since 3.0.0
 */
export type URI = typeof URI

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    readonly Compat: Compat<A>
  }
}

/**
 * @since 3.0.0
 */
export const compat: S.Schemable<URI> & S.WithUnion<URI> = {
  URI,
  literal,
  string,
  number,
  boolean,
  UnknownArray,
  UnknownRecord,
  type,
  nullable,
  partial,
  record,
  array,
  tuple: tuple as S.Schemable<URI>['tuple'],
  intersection,
  sum,
  lazy,
  union
}
