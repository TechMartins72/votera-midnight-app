import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<T> = {
}

export type ImpureCircuits<T> = {
  vote(context: __compactRuntime.CircuitContext<T>,
       _age_0: bigint,
       _country_0: Uint8Array,
       _candidate_0: number): __compactRuntime.CircuitResults<T, []>;
}

export type PureCircuits = {
}

export type Circuits<T> = {
  vote(context: __compactRuntime.CircuitContext<T>,
       _age_0: bigint,
       _country_0: Uint8Array,
       _candidate_0: number): __compactRuntime.CircuitResults<T, []>;
}

export type Ledger = {
  voters: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  readonly instance: bigint;
  votes: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: number): boolean;
    lookup(key_0: number): { read(): bigint }
  };
  readonly person: Uint8Array;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<T, W extends Witnesses<T> = Witnesses<T>> {
  witnesses: W;
  circuits: Circuits<T>;
  impureCircuits: ImpureCircuits<T>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<T>): __compactRuntime.ConstructorResult<T>;
}

export declare function ledger(state: __compactRuntime.StateValue): Ledger;
export declare const pureCircuits: PureCircuits;
