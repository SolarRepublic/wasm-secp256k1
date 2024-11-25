export * from './headless.js';

export type {SignatureAndRecovery, RecoveryValue} from './api/secp256k1-types.js';

import {base64_to_bytes} from '@blake.regalia/belt';

import {WasmSecp256k1, type Secp256k1} from './api/secp256k1.js';

import SB64_SECP256K1_WASM from '../public/out/secp256k1.wasm';

export const initWasmSecp256k1 = (): Promise<Secp256k1> => WasmSecp256k1(base64_to_bytes(SB64_SECP256K1_WASM));

