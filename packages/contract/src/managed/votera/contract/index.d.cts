import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<T> = {
  local_secret_key(context: __compactRuntime.WitnessContext<Ledger, T>): [T, Uint8Array];
}

export type ImpureCircuits<T> = {
  vote(context: __compactRuntime.CircuitContext<T>, candidate_0: string): __compactRuntime.CircuitResults<T, []>;
  receiveSupport(context: __compactRuntime.CircuitContext<T>,
                 coin_0: { nonce: Uint8Array, color: Uint8Array, value: bigint }): __compactRuntime.CircuitResults<T, []>;
  sendCoinToRecipient(context: __compactRuntime.CircuitContext<T>,
                      amount_0: bigint): __compactRuntime.CircuitResults<T, { change: { is_some: boolean,
                                                                                        value: { nonce: Uint8Array,
                                                                                                 color: Uint8Array,
                                                                                                 value: bigint
                                                                                               }
                                                                                      },
                                                                              sent: { nonce: Uint8Array,
                                                                                      color: Uint8Array,
                                                                                      value: bigint
                                                                                    }
                                                                            }>;
}

export type PureCircuits = {
  public_key(sk_0: Uint8Array, _instance_0: Uint8Array): Uint8Array;
}

export type Circuits<T> = {
  vote(context: __compactRuntime.CircuitContext<T>, candidate_0: string): __compactRuntime.CircuitResults<T, []>;
  receiveSupport(context: __compactRuntime.CircuitContext<T>,
                 coin_0: { nonce: Uint8Array, color: Uint8Array, value: bigint }): __compactRuntime.CircuitResults<T, []>;
  public_key(context: __compactRuntime.CircuitContext<T>,
             sk_0: Uint8Array,
             _instance_0: Uint8Array): __compactRuntime.CircuitResults<T, Uint8Array>;
  sendCoinToRecipient(context: __compactRuntime.CircuitContext<T>,
                      amount_0: bigint): __compactRuntime.CircuitResults<T, { change: { is_some: boolean,
                                                                                        value: { nonce: Uint8Array,
                                                                                                 color: Uint8Array,
                                                                                                 value: bigint
                                                                                               }
                                                                                      },
                                                                              sent: { nonce: Uint8Array,
                                                                                      color: Uint8Array,
                                                                                      value: bigint
                                                                                    }
                                                                            }>;
}

export type Ledger = {
  voters: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  readonly instance: bigint;
  candidates: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: string): boolean;
    lookup(key_0: string): { read(): bigint }
  };
  readonly person: Uint8Array;
  readonly totalTokenReceived: { nonce: Uint8Array,
                                 color: Uint8Array,
                                 value: bigint,
                                 mt_index: bigint
                               };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<T, W extends Witnesses<T> = Witnesses<T>> {
  witnesses: W;
  circuits: Circuits<T>;
  impureCircuits: ImpureCircuits<T>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<T>,
               name1_0: string,
               name2_0: string,
               name3_0: string): __compactRuntime.ConstructorResult<T>;
}

export declare function ledger(state: __compactRuntime.StateValue): Ledger;
export declare const pureCircuits: PureCircuits;
