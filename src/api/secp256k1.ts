import type {PointerNonceFn, PointerPubkey, PointerSeed, PointerSig, PointerSigRecoverable, RecoveryValue, Secp256k1WasmCore, Secp256k1WasmEcdh, Secp256k1WasmEcdsaRaw, Secp256k1WasmEcdsaRecovery, SignatureAndRecovery} from './secp256k1-types.js';
import type {ByteSize, Pointer} from '../types.js';
import type {Promisable} from '@blake.regalia/belt';

import {bytes} from '@blake.regalia/belt';

import {emsimp} from './emsimp.js';
import {BinaryResult, ByteLens, Flags} from './secp256k1-types.js';
import {map_wasm_exports, map_wasm_imports} from '../gen/wasm.js';


const S_TAG_ECDH = 'ECDH: ';
const S_TAG_ECDSA_VERIFY = 'ECDSA verify: ';
const S_TAG_TWEAK_ADD = 'k tweak add: ';
const S_TAG_TWEAK_MUL = 'k tweak mul: ';

const S_REASON_INVALID_SK = 'Invalid private key';
const S_REASON_INVALID_PK = 'Invalid public key';
const S_REASON_UNPARSEABLE_SIG = 'Unparseable signature';

const random_32 = () => crypto.getRandomValues(bytes(32));

/**
 * Wrapper instance providing operations backed by libsecp256k1 WASM module
 */
export interface Secp256k1 {
	/**
	 * Generates a new private key using crypto secure random bytes and without modulo bias
	 * @returns a new private key (32 bytes)
	 */
	gen_sk(): Uint8Array;

	/**
	 * Asserts that the given private key is valid, throws otherwise
	 * @param atu8_sk - the private key (32 bytes)
	 * @returns the same `Uint8Array`
	 */
	valid_sk(atu8_sk: Uint8Array): Uint8Array;

	/**
	 * Computes the public key for a given private key
	 * @param atu8_sk - the private key (32 bytes)
	 * @param b_uncompressed - optional flag to return the uncompressed (65 byte) public key
	 * @returns the public key (compressed to 33 bytes by default, or 65 if uncompressed)
	 */
	sk_to_pk(atu8_sk: Uint8Array, b_uncompressed?: boolean): Uint8Array;

	/**
	 * Signs the given message hash using the given private key.
	 * @param atu8_sk - the private key
	 * @param atu8_hash - the message hash (32 bytes)
	 * @param atu8_entropy - optional entropy to use
	 * @returns tuple of [compact signature (64 bytes) as concatenation of `r || s`, recovery ID byte]
	 */
	sign(atu8_sk: Uint8Array, atu8_hash: Uint8Array, atu8_ent?: Uint8Array): SignatureAndRecovery;

	/**
	 * Verifies the signature is valid for the given message hash and public key
	 * @param atu8_signature - compact signature in `r || s` form (64 bytes)
	 * @param atu8_msg - the message hash (32 bytes)
	 * @param atu8_pk - the public key
	 */
	verify(atu8_signature: Uint8Array, atu8_hash: Uint8Array, atu8_pk: Uint8Array): boolean;

	/**
	 * Recovers a public key from the given signature and recovery ID
	 * @param atu8_signature - compact signature in `r || s` form (64 bytes)
	 * @param xc_recovery - the recovery ID
	 * @param b_uncompressed - optional flag to return the uncompressed (65 byte) public key
	 */
	recover(atu8_signature: Uint8Array, atu8_hash: Uint8Array, xc_recovery: number, b_uncompressed?: boolean): Uint8Array;

	/**
	 * ECDH key exchange. Computes a shared secret given a private key some public key
	 * @param atu8_sk - the private key (32 bytes)
	 * @param atu8_pk - the public key (33 or 65 bytes)
	 * @returns the shared secret (32 bytes)
	 */
	ecdh(atu8_sk: Uint8Array, atu8_pk: Uint8Array): Uint8Array;

	/**
	 * Tweak the given private key by adding to it
	 * @param atu8_sk - the private key (32 bytes)
	 * @param atu8_tweak - the tweak vector (32 bytes)
	 * @returns the tweaked private key
	 */
	tweak_sk_add(atu8_sk: Uint8Array, atu8_tweak: Uint8Array): Uint8Array;

	/**
	 * Tweak the given private key by multiplying it
	 * @param atu8_sk - the private key (32 bytes)
	 * @param atu8_tweak - the tweak vector (32 bytes)
	 * @returns the tweaked private key
	 */
	tweak_sk_mul(atu8_sk: Uint8Array, atu8_tweak: Uint8Array): Uint8Array;

	/**
	 * Tweak the given public key by adding to it
	 * @param atu8_pk - the public key (33 or 65 bytes)
	 * @param atu8_tweak - the tweak vector (32 bytes)
	 * @param b_uncompressed - optional flag to return the uncompressed (65 byte) public key
	 * @returns the tweaked public key
	 */
	tweak_pk_add(atu8_pk: Uint8Array, atu8_tweak: Uint8Array, b_uncompressed?: boolean): Uint8Array;

	/**
	 * Tweak the given public key by multiplying it
	 * @param atu8_pk - the public key (33 or 65 bytes)
	 * @param atu8_tweak - the tweak vector (32 bytes)
	 * @param b_uncompressed - optional flag to return the uncompressed (65 byte) public key
	 * @returns the tweaked public key
	 */
	tweak_pk_mul(atu8_pk: Uint8Array, atu8_tweak: Uint8Array, b_uncompressed?: boolean): Uint8Array;

	/**
	 * Accepts a compressed 33-byte or uncompressed 65-byte public key and allows user to change its format
	 * @param atu8_pk - the public key (33 or 65 bytes)
	 * @param b_uncompressed - optional flag to return the uncompressed (65 byte) public key
	 * @returns the reformatted public key (unchanged if format is the same)
	 */
	reformat_pk(atu8_pk: Uint8Array, b_uncompressed?: boolean): Uint8Array;
}

/**
 * Creates a new instance of the secp256k1 WASM and returns its ES wrapper
 * @param z_src - a Response containing the WASM binary, a Promise that resolves to one,
 * 	or the raw bytes to the WASM binary as a {@link BufferSource}
 * @returns the wrapper API
 */
export const WasmSecp256k1 = async(
	z_src: Promisable<Response> | BufferSource
): Promise<Secp256k1> => {
	// prepare the runtime
	const [g_imports, f_bind_heap] = emsimp(map_wasm_imports, 'wasm-secp256k1');

	// prep the wasm module
	let d_wasm: WebAssembly.WebAssemblyInstantiatedSource;

	// instantiate wasm binary by streaming the response bytes
	if(z_src instanceof Response || z_src instanceof Promise) {
		d_wasm = await WebAssembly.instantiateStreaming(z_src as Response, g_imports);
	}
	// instantiate using raw bianry
	else {
		d_wasm = await WebAssembly.instantiate(z_src as BufferSource, g_imports);
	}

	// create the libsecp256k1 exports struct
	const g_wasm = map_wasm_exports<
		Secp256k1WasmCore
		& Secp256k1WasmEcdh
		& Secp256k1WasmEcdsaRaw
		& Secp256k1WasmEcdsaRecovery
	>(d_wasm.instance.exports);

	// bind the heap and ref its view(s)
	const [, ATU8_HEAP, ATU32_HEAP] = f_bind_heap(g_wasm.memory);

	// call into the wasm module's init method
	g_wasm.init();

	// ref malloc function
	const malloc = g_wasm.malloc;

	const ip_sk = malloc(ByteLens.PRIVATE_KEY);
	const ip_ent = malloc(ByteLens.NONCE_ENTROPY);
	const ip_seed = malloc<PointerSeed>(ByteLens.RANDOM_SEED);
	const ip_sk_shared = malloc(ByteLens.ECDH_SHARED_SK);
	const ip_msg_hash = malloc(ByteLens.MSG_HASH);

	// scratch spaces
	const ip_sig_scratch = malloc(ByteLens.ECDSA_SIG_COMPACT);
	const ip_pk_scratch = malloc(ByteLens.PUBLIC_KEY_MAX);

	// library handle: secp256k1_pubkey
	const ip_pk_lib = malloc<PointerPubkey>(ByteLens.PUBLIC_KEY_LIB);

	// library handle: secp256k1_ecdsa_signature
	const ip_sig_lib = malloc<PointerSig>(ByteLens.ECDSA_SIG_LIB);

	// library handle: secp256k1_ecdsa_signature
	const ip_sig_rcvr_lib = malloc<PointerSigRecoverable>(ByteLens.ECDSA_SIG_RECOVERABLE);

	// recovery id byte
	const ip_v = malloc(4);

	// create a reusable context
	const ip_ctx = g_wasm.context_create(Flags.CONTEXT_SIGN | Flags.CONTEXT_VERIFY);

	// length specifier
	const ip_len = g_wasm.malloc(4);
	const ip32_len = ip_len >> 2;



	/**
	 * Pads the given input data before copying it into the heap at the given location; throws if input
	 * data exceeds expected size
	 * @param atu8_data - the data to put into program memory
	 * @param ib_write - the starting byte position to write into
	 * @param nb_size - the size of the region
	 */
	const put_bytes = (atu8_data: Uint8Array, ip_write: Pointer, nb_size: ByteSize) => {
		const atu8_buffer = bytes(nb_size);
		atu8_buffer.set(atu8_data);
		ATU8_HEAP.set(atu8_buffer, ip_write);
	};

	/**
	 * Randomizes the context for better protection against CPU side-channel attacks
	 */
	const randomize_context = () => {
		// put random seed bytes into place
		put_bytes(random_32(), ip_seed, ByteLens.RANDOM_SEED);

		// randomize context
		if(BinaryResult.SUCCESS !== g_wasm.context_randomize(ip_ctx, ip_seed)) {
			throw Error('Failed to randomize context');
		}
	};

	/**
	 * Parses the input public key in preparation for use by some method
	 * @param atu8_sk - the private key
	 * @returns `true` on success, `false` otherwise
	 */
	const parse_pubkey = (atu8_pk: Uint8Array): boolean => {
		// copy input bytes into place
		put_bytes(atu8_pk, ip_pk_scratch, ByteLens.PUBLIC_KEY_MAX);

		// parse public key
		return BinaryResult.SUCCESS === g_wasm.ec_pubkey_parse(ip_ctx, ip_pk_lib, ip_pk_scratch, atu8_pk.length);
	};

	/**
	 * Puts the given private key into program memory, runs the given callback, then zeroes out the key
	 * @param atu8_sk - the private key
	 * @param f_use - callback to use the key
	 * @returns whatever the callback returns
	 */
	const with_sk = <
		w_return,
	>(atu8_sk: Uint8Array, f_use: () => w_return) => {
		// prep callback return
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

		// forward result
		return w_return;
	};

	/**
	 * Serializes the public key
	 * @param b_uncompressed - whether or not the result should be in compressed form (33 bytes) or not (65 bytes)
	 * @returns the public key as a buffer
	 */
	const get_pk = (b_uncompressed=false): Uint8Array => {
		// output length of public key
		const nb_pk = b_uncompressed? ByteLens.PUBLIC_KEY_UNCOMPRESSED: ByteLens.PUBLIC_KEY_COMPRESSED;

		// // set target output length in little endian for WASM runtime
		// DV_HEAP.setUint32(ip_len, nb_pk, true);

		// set target output length (the Web has basically become LE-only)
		ATU32_HEAP[ip32_len] = nb_pk;

		// prep compression flag
		const xm_compression = b_uncompressed? Flags.COMPRESSION_UNCOMPRESSED: Flags.COMPRESSION_COMPRESSED;

		// serialize public key
		g_wasm.ec_pubkey_serialize(ip_ctx, ip_pk_scratch, ip_len, ip_pk_lib, xm_compression);

		// extract result
		return ATU8_HEAP.slice(ip_pk_scratch, ip_pk_scratch+nb_pk);
	};

	/**
	 * Asserts the private key is valid
	 * @param atu8_sk - the private key (32 bytes)
	 * @returns the valid private key, or throws if the caller somehow discovered an invalid sk
	 */
	const valid_sk = (atu8_sk: Uint8Array): Uint8Array => {
		// while using the private key, assert the length is valid and the point falls within curve order
		if(with_sk(atu8_sk, () => ByteLens.PRIVATE_KEY as number !== atu8_sk.length || BinaryResult.SUCCESS !== g_wasm.ec_seckey_verify(ip_ctx, ip_sk))) {
			throw Error(S_REASON_INVALID_SK);
		}

		// return the valid sk
		return atu8_sk;
	};

	/**
	 * Creates a function to tweak a private key using either addition or multiplication
	 * @param f_tweak - the tweak function
	 * @param s_tag - the tag to use for error messages
	 * @returns a tweak function
	 */
	const tweak_sk = (f_tweak: typeof g_wasm['ec_seckey_tweak_add'], s_tag: string) => (atu8_sk: Uint8Array, atu8_tweak: Uint8Array) => {
		// randomize context
		randomize_context();

		// copy input bytes into place
		put_bytes(atu8_sk, ip_sk, ByteLens.PRIVATE_KEY);

		// use message hash memory for tweak vector
		put_bytes(atu8_tweak, ip_msg_hash, ByteLens.MSG_HASH);

		// apply the given tweak to the private key
		if(BinaryResult.SUCCESS !== f_tweak(ip_ctx, ip_sk, ip_msg_hash)) {
			// manually clear the private key
			atu8_sk.fill(0);

			throw Error('s'+s_tag+S_REASON_INVALID_SK);
		}

		// return tweaked private key
		return ATU8_HEAP.slice(ip_sk, ip_sk+ByteLens.PRIVATE_KEY);
	};

	/**
	 * Applies some transformation to a public key
	 * @param s_tag - tag to use for error messages
	 * @param atu8_pk - the public key bytes
	 * @param b_uncompressed - whether the output should be uncompressed 65-byte
	 * @param f_tweak - optional tweak function to apply
	 * @param atu8_tweak - optional tweak value to use
	 * @returns 
	 */
	const apply_pk = (
		s_tag: string,
		atu8_pk: Uint8Array,
		b_uncompressed: boolean,
		f_tweak?: typeof g_wasm['ec_pubkey_tweak_add'],
		atu8_tweak?: Uint8Array
	) => {
		// parse the public key
		if(!parse_pubkey(atu8_pk)) {
			throw Error(s_tag+S_REASON_INVALID_PK);
		}

		// copy input bytes into place
		put_bytes(atu8_pk, ip_pk_scratch, ByteLens.PUBLIC_KEY_MAX);

		// if tweak was specified
		if(f_tweak) {
			// use message hash memory for tweak vector
			put_bytes(atu8_tweak!, ip_msg_hash, ByteLens.MSG_HASH);

			// apply the given tweak to the public key
			if(BinaryResult.SUCCESS !== f_tweak(ip_ctx, ip_pk_lib, ip_msg_hash)) {
				throw Error('p'+s_tag+S_REASON_INVALID_PK);
			}
		}

		// return tweaked public key
		return get_pk(b_uncompressed);
	};

	/**
	 * Creates a function to tweak a public key using either addition or multiplication (or not at all)
	 * @param f_tweak - the tweak function
	 * @param s_tag - the tag to use for error messages
	 * @returns a tweak function
	 */
	const tweak_pk = (f_tweak: typeof g_wasm['ec_pubkey_tweak_add'], s_tag: string) => (
		atu8_pk: Uint8Array,
		atu8_tweak: Uint8Array,
		b_uncompressed=false
	) => apply_pk(s_tag, atu8_pk, b_uncompressed, f_tweak, atu8_tweak);

	// enstruct
	return {
		gen_sk: () => valid_sk(crypto.getRandomValues(bytes(ByteLens.PRIVATE_KEY))),

		valid_sk,

		sk_to_pk(atu8_sk, b_uncompressed=false) {
			// randomize context
			randomize_context();

			// while using the private key, compute its corresponding public key; from the docs:
			if(BinaryResult.SUCCESS !== with_sk(atu8_sk, () => g_wasm.ec_pubkey_create(ip_ctx, ip_pk_lib, ip_sk))) {
				throw Error('sk_to_pk: '+S_REASON_INVALID_SK);
			}

			// serialize the public key
			return get_pk(b_uncompressed);
		},

		sign(atu8_sk, atu8_hash, atu8_ent=random_32()) {
			// randomize context
			randomize_context();

			// copy message hash bytes into place
			put_bytes(atu8_hash, ip_msg_hash, ByteLens.MSG_HASH);

			// copy entropy bytes into place
			put_bytes(atu8_ent, ip_ent, ByteLens.NONCE_ENTROPY);

			// while using the private key, sign the given message hash
			if(BinaryResult.SUCCESS !== with_sk(atu8_sk, () => g_wasm.ecdsa_sign_recoverable(
				ip_ctx,
				ip_sig_rcvr_lib,
				ip_msg_hash,
				ip_sk,
				0 as PointerNonceFn,
				ip_ent
			))) {
				throw Error('ECDSA sign: '+S_REASON_INVALID_SK);
			}

			// serialize the signature in compact form as `r || s` (64 bytes)
			g_wasm.ecdsa_recoverable_signature_serialize_compact(ip_ctx, ip_sig_scratch, ip_v, ip_sig_rcvr_lib);

			// return serialized signature
			return [
				ATU8_HEAP.slice(ip_sig_scratch, ip_sig_scratch+ByteLens.ECDSA_SIG_COMPACT),
				ATU8_HEAP[ip_v] as RecoveryValue,  // terminal byte of 32-bit uint
			];
		},

		verify(atu8_signature, atu8_hash, atu8_pk) {
			// copy signature bytes into place
			put_bytes(atu8_signature, ip_sig_scratch, ByteLens.ECDSA_SIG_COMPACT);

			// copy message hash bytes into place
			put_bytes(atu8_hash, ip_msg_hash, ByteLens.MSG_HASH);

			// parse the public key
			if(!parse_pubkey(atu8_pk)) {
				throw Error(S_TAG_ECDSA_VERIFY+S_REASON_INVALID_PK);
			}

			// parse the signature
			if(BinaryResult.SUCCESS !== g_wasm.ecdsa_signature_parse_compact(ip_ctx, ip_sig_lib, ip_sig_scratch)) {
				throw Error(S_TAG_ECDSA_VERIFY+S_REASON_UNPARSEABLE_SIG);
			}

			// verify the signature
			return BinaryResult.SUCCESS === g_wasm.ecdsa_verify(ip_ctx, ip_sig_lib, ip_msg_hash, ip_pk_lib);
		},

		recover(atu8_signature, atu8_hash, xc_recovery, b_uncompressed=false) {
			// copy signature bytes into place
			put_bytes(atu8_signature, ip_sig_scratch, ByteLens.ECDSA_SIG_COMPACT);

			// parse the recoverable signature
			if(BinaryResult.SUCCESS !== g_wasm.ecdsa_recoverable_signature_parse_compact(ip_ctx, ip_sig_rcvr_lib, ip_sig_scratch, xc_recovery)) {
				throw Error(S_TAG_ECDSA_VERIFY+S_REASON_UNPARSEABLE_SIG);
			}

			// copy message hash bytes into place
			put_bytes(atu8_hash, ip_msg_hash, ByteLens.MSG_HASH);

			// recover the public key
			if(BinaryResult.SUCCESS !== g_wasm.ecdsa_recover(ip_ctx, ip_pk_lib, ip_sig_rcvr_lib, ip_msg_hash)) {
				throw Error(S_TAG_ECDSA_VERIFY+'Invalid signature');
			}

			// return recovered public key
			return get_pk(b_uncompressed);
		},

		ecdh(atu8_sk, atu8_pk) {
			// parse public key
			if(!parse_pubkey(atu8_pk)) throw Error(S_TAG_ECDH+S_REASON_INVALID_PK);

			// start using private key
			return with_sk(atu8_sk, () => {
				// perform ecdh computation
				if(BinaryResult.SUCCESS !== g_wasm.ecdh(ip_ctx, ip_sk_shared, ip_pk_lib, ip_sk)) {
					throw Error(S_TAG_ECDH+S_REASON_INVALID_SK);
				}

				// return copy of result bytes
				return ATU8_HEAP.slice(ip_sk_shared, ip_sk_shared+ByteLens.ECDH_SHARED_SK);
			});
		},

		tweak_sk_add: tweak_sk(g_wasm.ec_seckey_tweak_add, S_TAG_TWEAK_ADD),

		tweak_sk_mul: tweak_sk(g_wasm.ec_seckey_tweak_mul, S_TAG_TWEAK_MUL),

		tweak_pk_add: tweak_pk(g_wasm.ec_pubkey_tweak_add, S_TAG_TWEAK_ADD),

		tweak_pk_mul: tweak_pk(g_wasm.ec_pubkey_tweak_mul, S_TAG_TWEAK_MUL),

		reformat_pk: (atu8_pk: Uint8Array, b_uncompressed=false) => apply_pk('Reformat pk: ', atu8_pk, b_uncompressed),
	};
};

