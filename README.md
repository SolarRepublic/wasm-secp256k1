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

### [Demo webapp](https://starshell.net/wasm-secp256k1/) and its [source](https://github.com/SolarRepublic/wasm-secp256k1/blob/main/src/demo/webapp.ts)


## Install

```sh
npm install @solar-republic/wasm-secp256k1
```


## Usage

First, choose which import method suites your needs:

#### Default

Import with the WASM binary preloaded and uncompressed. No need to perform `fetch`, but bundle will be larger (+332 KiB).

```ts
import {initWasmSecp256k1} from '@solar-republic/wasm-secp256k1'
const secp256k1 = await initWasmSecp256k1();
```

#### Compressed

Import with the WASM binary preloaded and gzipped (requires access to `globalThis.DecompressionSteam`). No need to perform `fetch`, but bundle will be still be a bit larger (+175 KiB).

```ts
import {initWasmSecp256k1} from '@solar-republic/wasm-secp256k1/gzipped'
const secp256k1 = await initWasmSecp256k1();
```

#### Headless

Import without the WASM binary. Produces the smallest bundle size but requires fetching the binary yourself.

```ts
import {WasmSecp256k1} from '@solar-republic/wasm-secp256k1/headless';

// provide the binary (the constructor also accepts raw bytes)
const secp256k1 = await WasmSecp256k1(await fetch('secp256k1.wasm'));
```

### Using the instance:

```ts
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


## API

```ts
/**
 * Creates a new instance of the secp256k1 WASM and returns its ES wrapper
 * @param z_src - a Response containing the WASM binary, a Promise that resolves to one,
 * 	or the raw bytes to the WASM binary as a {@link BufferSource}
 * @returns the wrapper API
 */
export declare const WasmSecp256k1 = (dp_res: Promisable<Response> | BufferSource): Promise<Secp256k1>;

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


## Is libsecp256k1 modified?

No, the library is imported as a git submodule directly from upstream.


## Building from source

Prerequisites:
 - Docker
 - [Bun](https://bun.sh/) - a drop-in replacement for Node.js with native support for executing TypeScript

```sh
git clone --recurse-submodules https://github.com/SolarRepublic/wasm-secp256k1
cd wasm-secp256k1
bun install
bun run build
```

The WASM binary will be output to `public/out/secp256k1.wasm`.

The Emscripten-generated js file at `public/out/secp256k1.js` is not needed for production if you are using the provided wrapper.


## See also

[hash-wasm](https://github.com/Daninet/hash-wasm/tree/master) is a great library that provides performant hashing using optimized WASM binaries. Though its API is asynchronous, it also provides an undocumented synchronous API.
