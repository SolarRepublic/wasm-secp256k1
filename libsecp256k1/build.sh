#!/bin/bash
set -euxfo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

rm -rf $SCRIPT_DIR/dist
mkdir -p $SCRIPT_DIR/dist

EXPORTED_FUNCTIONS='''
    "_malloc"
    "_free"
    "_secp256k1_context_create"
    "_secp256k1_context_randomize"
    "_secp256k1_ec_seckey_verify"
    "_secp256k1_ec_pubkey_create"
    "_secp256k1_ec_pubkey_parse"
    "_secp256k1_ec_pubkey_serialize"
    "_secp256k1_ecdsa_signature_parse_compact"
    "_secp256k1_ecdsa_recover"
    "_secp256k1_ecdsa_recoverable_signature_serialize_compact"
    "_secp256k1_ecdsa_recoverable_signature_parse_compact"
    "_secp256k1_ecdsa_sign"
    "_secp256k1_ecdsa_signature_parse_compact"
    "_secp256k1_ecdsa_signature_serialize_compact"
    "_secp256k1_ecdsa_sign_recoverable"
    "_secp256k1_ecdsa_verify"
'''
join() {
  local input="$1"
  echo "$input" | sed '/^[[:space:]]*$/d' | tr -d '"' | tr '\n' ',' | sed 's/, *$//' | sed 's/,$//'
}

JOINED=$(join "$EXPORTED_FUNCTIONS")

(cd $SCRIPT_DIR/secp256k1 && ./autogen.sh)
(cd $SCRIPT_DIR/secp256k1 && \
    emconfigure ./configure \
    --enable-module-recovery=yes \
    --enable-coverage=no \
    --enable-benchmark=no \
    --enable-tests=no \
    --enable-ctime-tests=no \
    --enable-experimental=no \
    --enable-exhaustive-tests=no \
    --enable-examples=no \
    --enable-module-ecdh=no \
    --enable-module-extrakeys=no \
    --enable-module-schnorrsig=no \
    --enable-module-musig=no \
    --enable-module-ellswift=no \
    --enable-external-default-callbacks=no \
    CFLAGS="-fdata-sections -ffunction-sections -O2")
(cd $SCRIPT_DIR/secp256k1 && emmake make FORMAT=wasm)
(cd $SCRIPT_DIR/secp256k1 && \
    emcc src/libsecp256k1_precomputed_la-precomputed_ecmult.o \
    src/libsecp256k1_precomputed_la-precomputed_ecmult_gen.o \
    src/libsecp256k1_la-secp256k1.o \
    -O3 \
    -s WASM=1 \
    -s "BINARYEN_METHOD='native-wasm'" \
    -s DETERMINISTIC=1 \
    -s NO_EXIT_RUNTIME=1 \
    -s MINIMAL_RUNTIME=1 \
    -s EXPORTED_FUNCTIONS="[$JOINED]" \
    -o $SCRIPT_DIR/dist/secp256k1.js)
