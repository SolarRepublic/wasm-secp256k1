# wasm-secp256k1

The [libsecp256k1 C library](https://github.com/bitcoin-core/secp256k1) compiled to WASM and wrapped with an ultralight TypeScript API.

Supports four basic operations:
 - Computing the corresponding public key for a given private key
 - Signing
 - Verifying
 - ECDH

This module offers *substantially* greater security than pure JavaScript implementations of Secp256k1 due to the fact that JS runtimes simply make it impossible for JS developers to effectively mitigate side-channel attacks. Anyone who says otherwise doesn't know what they're talking about.

In addition to zero-ing out private keys after use, the wrapper also randomizes the lib context every time a public key is computed or a message is signed.

Signature recovery is not currently enabled, but is easy to add. If you would like it, please open an issue.


## API

```ts
/**
 * Creates a new instance of the secp256k1 WASM and returns its ES wrapper
 * @param dp_res - a Response containing the WASM binary, or a Promise that resolves to one
 * @returns the wrapper API
 */
export declare const wasm_secp256k1 = (dp_res: Promisable<Response>): Promise<Secp256k1>;

/**
 * Wrapper instance providing operations backed by libsecp256k1 WASM module
 */
interface Secp256k1 {
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
    * @returns compact signature (64 bytes) as concatenation of `r || s`
    */
    sign(atu8_sk: Uint8Array, atu8_hash: Uint8Array, atu8_ent?: Uint8Array): Uint8Array;

    /**
    * Verifies the signature is valid for the given message hash and public key
    * @param atu8_signature - compact signature in `r || s` form (64 bytes)
    * @param atu8_msg - the message hash (32 bytes)
    * @param atu8_pk - the public key
    */
    verify(atu8_signature: Uint8Array, atu8_hash: Uint8Array, atu8_pk: Uint8Array): boolean;

    /**
    * ECDH key exchange. Computes a shared secret given a private key some public key
    * @param atu8_sk - the private key (32 bytes)
    * @param atu8_pk - the public key (33 or 65 bytes)
    * @returns the shared secret (32 bytes)
    */
    ecdh(atu8_sk: Uint8Array, atu8_pk: Uint8Array): Uint8Array;
}
```


## Is libsecp256k1 modified?

No, it's used as a submodule from upstream.


