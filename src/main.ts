export type {SignatureAndRecovery, RecoveryValue } from './api/secp256k1-types';
export { ByteLens } from './api/secp256k1-types';
export type { Secp256k1 } from './api/secp256k1';

import { Secp256k1, WasmSecp256k1 } from './api/secp256k1';
import SB64_SECP256K1_WASM from './gen/secp256k1.wasm';

export const initWasmSecp256k1 = (): Promise<Secp256k1> => WasmSecp256k1(Buffer.from(SB64_SECP256K1_WASM, 'base64url'));
