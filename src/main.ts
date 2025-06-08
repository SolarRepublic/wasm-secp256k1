export * from './headless.js';

export type {SignatureAndRecovery, RecoveryValue} from './api/secp256k1-types.js';

import {WasmSecp256k1, type Secp256k1} from './api/secp256k1.js';

import SB64_SECP256K1_WASM from '../public/out/secp256k1.wasm';

// base64 character set
const SX_CHARS_BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// base64 decoder
const base64_to_bytes = (sb64_data: string): Uint8Array => {
	// remove padding from string and normalize from URL-safe variant
	sb64_data = sb64_data.replace(/=+$/, '').replace(/[-_]/g, s => '-' === s? '+': '_' === s? '/': s);

	// a buffer to store decoded sextets
	let xb_work = 0;

	// number of bits in the buffer
	let nb_buffer = 0;

	// prep output values
	const a_out: number[] = [];

	// each character
	for(const s_char of sb64_data) {
		// decode character value
		const xb_char = SX_CHARS_BASE64.indexOf(s_char);

		// invalid base64-encoding
		if(-1 === xb_char) throw new Error('Invalid base64 string');

		// add 6 bits from index to buffer
		xb_work = (xb_work << 6) | xb_char;

		// increase size of buffer which checking if a whole byte exists in the buffer
		if((nb_buffer += 6) >= 8) {
			// move byte out of buffer
			a_out.push(xb_work >>> (nb_buffer -= 8));

			// trim the buffer
			xb_work &= (1 << nb_buffer) - 1;
		}
	}

	return new Uint8Array(a_out);
}

/**
 * Initializes WASM module, decodes WASM binary from base64-encoded string
 */
export const initWasmSecp256k1 = (): Promise<Secp256k1> => WasmSecp256k1(base64_to_bytes(SB64_SECP256K1_WASM));

