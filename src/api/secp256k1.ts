import type {ByteSize, Pointer} from '../types.js';

import type {Promisable} from '@blake.regalia/belt';

import {buffer, dataview} from '@blake.regalia/belt';

import {emsimp} from './emsimp.js';
import {map_wasm_exports, map_wasm_imports} from '../gen/wasm.js';

/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
const enum ByteLens {
	PRIVATE_KEY = 32,
	EXTRA_ENTROPY = 32,
	PUBLIC_KEY_COMPRESSED = 33,
	PUBLIC_KEY_LIB = 64,  // secp256k1_pubkey: char [64];
	PUBLIC_KEY_UNCOMPRESSED = 65,
	PUBLIC_KEY_MAX = 65,
	ECDH_SHARED_SK = 32,
	ECDSA_SIG_COMPACT = 64,
	ECDSA_SIG_LIB = 64,  // secp256k1_ecdsa_signature: char [64];
	ECDSA_SIG_RECOVERABLE = 65,
	ECDSA_SIG_MAX = 72,
	MSG_HASH = 32,
	RANDOM_SEED = 32,
}

// ##### From secp256k1.h: #####
// /* All flags' lower 8 bits indicate what they're for. Do not use directly. */
// #define SECP256K1_FLAGS_TYPE_MASK ((1 << 8) - 1)
// #define SECP256K1_FLAGS_TYPE_CONTEXT (1 << 0)
// #define SECP256K1_FLAGS_TYPE_COMPRESSION (1 << 1)
// /* The higher bits contain the actual data. Do not use directly. */
// #define SECP256K1_FLAGS_BIT_CONTEXT_VERIFY (1 << 8)
// #define SECP256K1_FLAGS_BIT_CONTEXT_SIGN (1 << 9)
// #define SECP256K1_FLAGS_BIT_CONTEXT_DECLASSIFY (1 << 10)
// #define SECP256K1_FLAGS_BIT_COMPRESSION (1 << 8)

/* eslint-disable @typescript-eslint/prefer-literal-enum-member, no-multi-spaces */
const enum Flags {
	CONTEXT_NONE        = (1 << 0) | 0,
	CONTEXT_VERIFY      = (1 << 0) | (1 << 8),
	CONTEXT_SIGN        = (1 << 0) | (1 << 9),
	CONTEXT_DECLASSIFY  = (1 << 0) | (1 << 10),

	COMPRESSION_UNCOMPRESSED  = (1 << 1) | 0,
	COMPRESSION_COMPRESSED    = (1 << 1) | (1 << 8),
}
/* eslint-enable */

const S_TAG_ECDH_FAIL = 'ECDH failed: Invalid ';

/**
 * Wrapper instance providing operations backed by libsecp256k1 WASM module
 */
export interface Secp256k1 {
	/**
	 * ECDH key exchange
	 * @param atu8_sk - the private key (32 bytes)
	 * @param atu8_pk - the public key (33 or 65 bytes)
	 * @returns the shared secret (32 bytes)
	 */
	ecdh(atu8_sk: Uint8Array, atu8_pk: Uint8Array): Uint8Array;

	/**
	 * Computes the public key for a given private key
	 * @param atu8_sk - the private key (32 bytes)
	 * @param b_uncompressed - optional flag to return the uncompressed (65 byte) public key
	 * @returns the public key (compressed to 33 bytes by default, or 65 if uncompressed)
	 */
	sk_to_pk(atu8_sk: Uint8Array, b_uncompressed?: boolean): Uint8Array;
}

/**
 * Creates a new instance of the secp256k1 WASM and returns its ES wrapper
 */
export const wasm_secp256k1 = async(dp_res: Promisable<Response>): Promise<Secp256k1> => {
	// prepare the runtime
	const [g_imports, f_bind_heap] = emsimp(map_wasm_imports, 'wasm-secp256k1');

	// instantiate wasm binary by streaming the response bytes
	const d_wasm = await WebAssembly.instantiateStreaming(dp_res, g_imports);

	// create the libsecp256k1 exports struct
	const g_wasm = map_wasm_exports(d_wasm.instance.exports);

	// bind the heap and ref its view(s)
	const [AB_HEAP, ATU8_HEAP, ATU32] = f_bind_heap(g_wasm.memory);
	const DV_HEAP = dataview(AB_HEAP);

	// call into the wasm module's init method
	g_wasm.init();


	// mallocs
	const malloc = g_wasm.malloc;

	const ip_sk = malloc(ByteLens.PRIVATE_KEY);
	const ip_pk_lib = malloc(ByteLens.PUBLIC_KEY_LIB);
	const ip_pk_scratch = malloc(ByteLens.PUBLIC_KEY_MAX);
	const ip_sk_shared = malloc(ByteLens.ECDH_SHARED_SK);

	// create a reusable context
	const ip_ctx = g_wasm.context_create(Flags.CONTEXT_SIGN | Flags.CONTEXT_VERIFY);

	// 
	const ip_len = g_wasm.malloc(4);
	const ip32_len = ip_len >> 2;


	/**
	 * Pads the given input data before copying it into the heap at the given location; throws if input
	 * data exceeds expected size
	 */
	const put_bytes = (atu8_data: Uint8Array, ib_write: Pointer, nb_size: ByteSize) => {
		const atu8_buffer = buffer(nb_size);
		atu8_buffer.set(atu8_data);
		ATU8_HEAP.set(atu8_buffer, ib_write);
	};

	/**
	 * Parses the input public key in preparation for use by some method
	 */
	const parse_pubkey = (atu8_pk: Uint8Array): boolean => {
		// copy input bytes into place
		put_bytes(atu8_pk, ip_pk_scratch, ByteLens.PUBLIC_KEY_MAX);

		// parse public key. from the docs:
		// *  Returns: 1 if the public key was fully valid.
		// *           0 if the public key could not be parsed or is invalid.
		return 1 === g_wasm.ec_pubkey_parse(ip_ctx, ip_pk_lib, ip_pk_scratch, atu8_pk.length);
	};

	const with_sk = <
		w_return,
	>(atu8_sk: Uint8Array, f_use: () => w_return) => {
		let w_return: w_return;

		// in case of any exception..
		try {
			// copy input bytes into place
			put_bytes(atu8_sk, ip_sk, ByteLens.PRIVATE_KEY);

			// use private key
			w_return = f_use();
		}
		finally {
			// zero-out private key
			ATU8_HEAP.fill(0, ip_sk, ip_sk+ByteLens.PRIVATE_KEY);
		}

		return w_return;
	};

	const get_pk = (b_uncompressed=false) => {
		const nb_pk = b_uncompressed? ByteLens.PUBLIC_KEY_UNCOMPRESSED: ByteLens.PUBLIC_KEY_COMPRESSED;

		DV_HEAP.setUint32(ip_len, nb_pk);
		// ATU32.se [ip32_len] = b_uncompressed? ByteLens.PUBLIC_KEY_UNCOMPRESSED: ByteLens.PUBLIC_KEY_COMPRESSED;

		g_wasm.ec_pubkey_serialize(ip_ctx, ip_pk_scratch, ip_len, ip_pk_lib, nb_pk);

		return ATU8_HEAP.slice(ip_pk_scratch, nb_pk);
	};

	return {
		ecdh(atu8_sk: Uint8Array, atu8_pk: Uint8Array): Uint8Array {
			// parse public key
			if(!parse_pubkey(atu8_pk)) throw Error(S_TAG_ECDH_FAIL+'public key');

			// start using private key
			return with_sk(atu8_sk, () => {
				// from the docs:
				// *  Returns: 1: exponentiation was successful
				// *           0: scalar was invalid (zero or overflow) or hashfp returned 0
				if(1 !== g_wasm.ecdh(ip_ctx, ip_sk_shared, ip_pk_lib, ip_sk)) {
					throw Error(S_TAG_ECDH_FAIL+'private key');
				}

				// return copy of result bytes
				return ATU8_HEAP.slice(ip_sk_shared, ByteLens.ECDH_SHARED_SK);
			});
		},

		sk_to_pk(atu8_sk: Uint8Array, b_uncompressed=false): Uint8Array {
			// start using private key; from the docs:
			// *  Returns: 1: secret was valid, public key stores.
			// *           0: secret was invalid, try again.
			if(1 !== with_sk(atu8_sk, () => g_wasm.ec_pubkey_create(ip_ctx, ip_pk_lib, ip_sk))) {
				throw Error('sk_to_pk: Invalid private key');
			}

			return get_pk(b_uncompressed);
		},
	};
};

