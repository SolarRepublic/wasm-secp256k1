# wasm-secp256k1

The [libsecp256k1 C library](https://github.com/bitcoin-core/secp256k1) compiled to WASM and wrapped with an ultralight TypeScript API.

Supports four basic operations:
 - Computing the corresponding public key for a given private key
 - Signing
 - Verifying
 - ECDH

This module offers *substantially* greater security than pure JavaScript implementations of Secp256k1 due to the fact that JS runtimes simply make it impossible for JS developers to effectively mitigate side-channel attacks. Anyone who says otherwise doesn't know what they're talking about.

In addition to zero-ing out private keys after use, the wrapper also randomizes the lib context every time a public key is computed or a message is signed.

Signature recovery is not currently enabled, but is easy to add. If you meed it, please open an issue.


## Install

```sh
npm install @solar-republic/wasm-secp256k1
```


## API

```ts
/**
 * Creates a new instance of the secp256k1 WASM and returns its ES wrapper
 * @param dp_res - a Response containing the WASM binary, or a Promise that resolves to one
 * @returns the wrapper API
 */
export declare const WasmSecp256k1 = (dp_res: Promisable<Response>): Promise<Secp256k1>;

/**
 * Wrapper instance providing operations backed by libsecp256k1 WASM module
 */
interface Secp256k1 {
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


## Example

```ts
import {WasmSecp256k1} from '@solar-republic/wasm-secp256k1';

// instantiate WASM module
const secp256k1 = WasmSecp256k1(await fetch('secp256k1.wasm'));


// generate a random private key
const sk = secp256k1.gen_sk()

// get its corresponding public key
const pk = secp256k1.sk_to_pk(sk);

// sign a message hash (caller is responsible for actually hashing the message and providing entropy)
const signed = secp256k1.sign(sk, messageHash, entropy);

// verify a given message hash is signed by some public key
const verified = secp256k1.verify(signed, messageHash, pk);

// derive a shared secret with some other's public key
const shared = secp256k1.ecdh(sk, otherPk);


// zero out private key
sk.fill(0, 0, 32);
```

Caller is responsible for zero-ing out private keys in the Typed Arrays it passes. Library only zeroes out the bytes in the copies it makes.


## Is libsecp256k1 modified?

The library is imported as a git submodule directly from upstream.

However, there is one modification made by default to `hash_impl.h` and `hash.h` to make the sha256 hashing functions external. This makes it so that they can be used from JS environment to provide a synchronous hash function, which can be useful in certain contexts where developers would otherwise be relegated to Web Crypto's async API.

You can review the changes made [here](./blob/main/scripts/compile.sh#L81-L82). It simply removes the `static` storage modifier and adds `external` in the include header to those three sha256 functions.

If you don't want or disagree with those changes, you can omit the `--externalize-sha256` option passed to the compile script.
