import type {WasmExportsExtension} from '../gen/glue';
import type {ByteSize, Pointer} from '../types.js';

export type PointerContext = Pointer<'context'>;
export type PointerSeed = Pointer<'seed'>;
export type PointerPubkey = Pointer<'pubkey'>;
export type PointerSig = Pointer<'ecdsa_signature'>;
export type PointerSigRecoverable = Pointer<'ecdsa_recoverable_signature'>;
export type PointerNonceFn = Pointer<'nonce_function'>;

export type PointerSha256 = Pointer<'sha256'>;

export type RecoveryValue = 0 | 1 | 2 | 3;

export type SignatureAndRecovery = [
	atu8_signature: Uint8Array,
	xc_recovery: RecoveryValue,
];


/* eslint-disable @typescript-eslint/no-duplicate-enum-values, @typescript-eslint/prefer-literal-enum-member */
export const enum ByteLens {
	RANDOM_SEED = 32,  // when randomizing context

	PRIVATE_KEY = 32,

	PUBLIC_KEY_COMPRESSED = 33,
	PUBLIC_KEY_LIB = 64,  // secp256k1_pubkey: char [64];
	PUBLIC_KEY_UNCOMPRESSED = 65,
	PUBLIC_KEY_MAX = 65,  // uncompressed public key is largest

	ECDSA_SIG_COMPACT = 64,
	ECDSA_SIG_LIB = 64,  // secp256k1_ecdsa_signature: char [64];
	ECDSA_SIG_RECOVERABLE = 65,  // secp256k1_ecdsa_recoverable_signature: char [65];

	MSG_HASH = 32,
	NONCE_ENTROPY = 32,

	/**
	 * From the source:
	 * ```
	 * typedef struct {
	 *   uint32_t s[8];
	 *   unsigned char buf[64];
	 *   uint64_t bytes;
	 * } secp256k1_sha256;
	 * ```
	 */
	SHA256 = (4 * 8) + 64 + 8,
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
export const enum Flags {
	CONTEXT_NONE        = (1 << 0) | 0,
	CONTEXT_VERIFY      = (1 << 0) | (1 << 8),
	CONTEXT_SIGN        = (1 << 0) | (1 << 9),
	CONTEXT_DECLASSIFY  = (1 << 0) | (1 << 10),

	COMPRESSION_UNCOMPRESSED  = (1 << 1) | 0,
	COMPRESSION_COMPRESSED    = (1 << 1) | (1 << 8),
}
/* eslint-enable */


export const enum BinaryResult {
	SUCCESS = 1,
	FAILURE = 0,
}

export interface Secp256k1WasmCore extends WasmExportsExtension {
	/** Create a secp256k1 context object (in dynamically allocated memory).
	 *
	 *  This function uses malloc to allocate memory. It is guaranteed that malloc is
	 *  called at most once for every call of this function. If you need to avoid dynamic
	 *  memory allocation entirely, see secp256k1_context_static and the functions in
	 *  secp256k1_preallocated.h.
	 *
	 *  Returns: a newly created context object.
	 *  In:      flags: Always set to SECP256K1_CONTEXT_NONE (see below).
	 */
	context_create(
		xm_flags: Flags,
	): PointerContext;


	/** Randomizes the context to provide enhanced protection against side-channel leakage.
	 *
	 *  Returns: 1: randomization successful
	 *           0: error
	 *  Args:    ctx:       pointer to a context object (not secp256k1_context_static).
	 *  In:      seed32:    pointer to a 32-byte random seed (NULL resets to initial state).
	 */
	context_randomize(
		ip_ctx: PointerContext,
		ip_seed: PointerSeed,
	): BinaryResult;


	/** Compute the public key for a secret key.
	 *
	 *  Returns: 1: secret was valid, public key stores.
	 *           0: secret was invalid, try again.
	 *  Args:    ctx:    pointer to a context object (not secp256k1_context_static).
	 *  Out:     pubkey: pointer to the created public key.
	 *  In:      seckey: pointer to a 32-byte secret key.
	 */
	ec_pubkey_create(
		ip_ctx: PointerContext,
		ip_pk_out: PointerPubkey,
		ip_sk_in: Pointer<32>,
	): BinaryResult;


	/** Verify an ECDSA secret key.
	 *
	 *  A secret key is valid if it is not 0 and less than the secp256k1 curve order
	 *  when interpreted as an integer (most significant byte first). The
	 *  probability of choosing a 32-byte string uniformly at random which is an
	 *  invalid secret key is negligible.
	 *
	 *  Returns: 1: secret key is valid
	 *           0: secret key is invalid
	 *  Args:    ctx: pointer to a context object.
	 *  In:      seckey: pointer to a 32-byte secret key.
	 */
	ec_seckey_verify(
		ip_ctx: PointerContext,
		ip_sk_in: Pointer<32>,
	): BinaryResult;


	/** Parse a variable-length public key into the pubkey object.
	 *
	 *  Returns: 1 if the public key was fully valid.
	 *           0 if the public key could not be parsed or is invalid.
	 *  Args: ctx:      a secp256k1 context object.
	 *  Out:  pubkey:   pointer to a pubkey object. If 1 is returned, it is set to a
	 *                  parsed version of input. If not, its value is undefined.
	 *  In:   input:    pointer to a serialized public key
	 *        inputlen: length of the array pointed to by input
	 */
	ec_pubkey_parse(
		ip_ctx: PointerContext,
		ip_pk_out: PointerPubkey,
		ip_pk_in: Pointer<65>,
		nb_len: ByteSize,
	): BinaryResult;


	/** Serialize a pubkey object into a serialized byte sequence.
	 *
	 *  Returns: 1 always.
	 *  Args:   ctx:        a secp256k1 context object.
	 *  Out:    output:     a pointer to a 65-byte (if compressed==0) or 33-byte (if
	 *                      compressed==1) byte array to place the serialized key
	 *                      in.
	 *  In/Out: outputlen:  a pointer to an integer which is initially set to the
	 *                      size of output, and is overwritten with the written
	 *                      size.
	 *  In:     pubkey:     a pointer to a secp256k1_pubkey containing an
	 *                      initialized public key.
	 *          flags:      SECP256K1_EC_COMPRESSED if serialization should be in
	 *                      compressed format, otherwise SECP256K1_EC_UNCOMPRESSED.
	 */
	ec_pubkey_serialize(
		ip_ctx: PointerContext,
		ip_pk_out: Pointer<65>,
		ip_len_inout: Pointer<4>,
		ip_pk_in: PointerPubkey,
		xm_flags: Flags,
	): BinaryResult.SUCCESS;
}


export interface Secp256k1WasmEcdsaRaw {
	/** Parse an ECDSA signature in compact (64 bytes) format.
	 *
	 *  Returns: 1 when the signature could be parsed, 0 otherwise.
	 *  Args: ctx:      a secp256k1 context object
	 *  Out:  sig:      a pointer to a signature object
	 *  In:   input64:  a pointer to the 64-byte array to parse
	 *
	 *  The signature must consist of a 32-byte big endian R value, followed by a
	 *  32-byte big endian S value. If R or S fall outside of [0..order-1], the
	 *  encoding is invalid. R and S with value 0 are allowed in the encoding.
	 *
	 *  After the call, sig will always be initialized. If parsing failed or R or
	 *  S are zero, the resulting sig value is guaranteed to fail verification for
	 *  any message and public key.
	 */
	ecdsa_signature_parse_compact(
		ip_ctx: PointerContext,
		ip_sig_out: PointerSig,
		ip_sig_in: Pointer<64>,
	): BinaryResult;


	/** Serialize an ECDSA signature in compact (64 byte) format.
	 *
	 *  Returns: 1
	 *  Args:   ctx:       a secp256k1 context object
	 *  Out:    output64:  a pointer to a 64-byte array to store the compact serialization
	 *  In:     sig:       a pointer to an initialized signature object
	 *
	 *  See secp256k1_ecdsa_signature_parse_compact for details about the encoding.
	 */
	ecdsa_signature_serialize_compact(
		ip_ctx: PointerContext,
		ip_sig_out: Pointer<64>,
		ip_sig_in: PointerSig,
	): BinaryResult.SUCCESS;


	/** Create an ECDSA signature.
	 *
	 *  Returns: 1: signature created
	 *           0: the nonce generation function failed, or the secret key was invalid.
	 *  Args:    ctx:       pointer to a context object (not secp256k1_context_static).
	 *  Out:     sig:       pointer to an array where the signature will be placed.
	 *  In:      msghash32: the 32-byte message hash being signed.
	 *           seckey:    pointer to a 32-byte secret key.
	 *           noncefp:   pointer to a nonce generation function. If NULL,
	 *                      secp256k1_nonce_function_default is used.
	 *           ndata:     pointer to arbitrary data used by the nonce generation function
	 *                      (can be NULL). If it is non-NULL and
	 *                      secp256k1_nonce_function_default is used, then ndata must be a
	 *                      pointer to 32-bytes of additional data.
	 *
	 * The created signature is always in lower-S form. See
	 * secp256k1_ecdsa_signature_normalize for more details.
	 */
	ecdsa_sign(
		ip_ctx: PointerContext,
		ip_sig_out: PointerSig,
		ip_hash_in: Pointer<32>,
		ip_sk: Pointer<32>,
		ip_noncefn?: PointerNonceFn,
		ip_ent?: Pointer<32>,
	): BinaryResult;


	/** Verify an ECDSA signature.
	 *
	 *  Returns: 1: correct signature
	 *           0: incorrect or unparseable signature
	 *  Args:    ctx:       a secp256k1 context object.
	 *  In:      sig:       the signature being verified.
	 *           msghash32: the 32-byte message hash being verified.
	 *                      The verifier must make sure to apply a cryptographic
	 *                      hash function to the message by itself and not accept an
	 *                      msghash32 value directly. Otherwise, it would be easy to
	 *                      create a "valid" signature without knowledge of the
	 *                      secret key. See also
	 *                      https://bitcoin.stackexchange.com/a/81116/35586 for more
	 *                      background on this topic.
	 *           pubkey:    pointer to an initialized public key to verify with.
	 */
	ecdsa_verify(
		ip_ctx: PointerContext,
		ip_sig_in: PointerSig,
		ip_hash_in: Pointer<32>,
		ip_pk_in: PointerPubkey,
	): BinaryResult;
}


export interface Secp256k1WasmEcdsaRecovery {
	/** Parse a compact ECDSA signature (64 bytes + recovery id).
	 *
	 *  Returns: 1 when the signature could be parsed, 0 otherwise
	 *  Args: ctx:     a secp256k1 context object
	 *  Out:  sig:     a pointer to a signature object
	 *  In:   input64: a pointer to a 64-byte compact signature
	 *        recid:   the recovery id (0, 1, 2 or 3)
	 */
	ecdsa_recoverable_signature_parse_compact(
		ip_ctx: PointerContext,
		ip_sig_out: PointerSigRecoverable,
		ip_sig_in: Pointer<64>,
		xb_v_in: number,
	): BinaryResult;


	/** Serialize an ECDSA signature in compact format (64 bytes + recovery id).
	 *
	 *  Returns: 1
	 *  Args: ctx:      a secp256k1 context object.
	 *  Out:  output64: a pointer to a 64-byte array of the compact signature.
	 *        recid:    a pointer to an integer to hold the recovery id.
	 *  In:   sig:      a pointer to an initialized signature object.
	 */
	ecdsa_recoverable_signature_serialize_compact(
		ip_ctx: PointerContext,
		ip_sig_out: Pointer<64>,
		ip_v_out: Pointer<4>,
		ip_sig_in: PointerSigRecoverable,
	): BinaryResult.SUCCESS;


	/** Create a recoverable ECDSA signature.
	 *
	 *  Returns: 1: signature created
	 *           0: the nonce generation function failed, or the secret key was invalid.
	 *  Args:    ctx:       pointer to a context object (not secp256k1_context_static).
	 *  Out:     sig:       pointer to an array where the signature will be placed.
	 *  In:      msghash32: the 32-byte message hash being signed.
	 *           seckey:    pointer to a 32-byte secret key.
	 *           noncefp:   pointer to a nonce generation function. If NULL,
	 *                      secp256k1_nonce_function_default is used.
	 *           ndata:     pointer to arbitrary data used by the nonce generation function
	 *                      (can be NULL for secp256k1_nonce_function_default).
	 */
	ecdsa_sign_recoverable(
		ip_ctx: PointerContext,
		ip_sig_out: PointerSigRecoverable,
		ip_hash_in: Pointer<32>,
		ip_sk_in: Pointer<32>,
		ip_noncefn_in: PointerNonceFn,
		ip_ent_in: Pointer<32>,
	): BinaryResult;


	/** Recover an ECDSA public key from a signature.
	 *
	 *  Returns: 1: public key successfully recovered (which guarantees a correct signature).
	 *           0: otherwise.
	 *  Args:    ctx:       pointer to a context object.
	 *  Out:     pubkey:    pointer to the recovered public key.
	 *  In:      sig:       pointer to initialized signature that supports pubkey recovery.
	 *           msghash32: the 32-byte message hash assumed to be signed.
	 */
	ecdsa_recover(
		ip_ctx: PointerContext,
		ip_pk_out: PointerPubkey,
		ip_sig_in: PointerSigRecoverable,
		ip_hash_in: Pointer<32>,
	): BinaryResult;
}


export interface Secp256k1WasmSha256 {
	sha256_initialize(
		ip_hash: PointerSha256,
	): void;

	sha256_write(
		ip_hash: PointerSha256,
		ip_data_in: Pointer<number>,
		nb_data_in: number,
	): void;

	sha256_finalize(
		ip_hash: PointerSha256,
		ip_digest_out: Pointer<32>,
	): void;
}
