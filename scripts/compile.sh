#!/bin/bash

# method for joining a multiline string list using a delimiter
join() {
	s_list=$1; s_delim=$2

	echo -n "${s_list/$'\n'/}" | tr '\n' "$s_delim" | sed "s/$s_delim$//"
}

# list of functions to export
s_exports='''
"_malloc"
"_free"
"_secp256k1_context_create"
"_secp256k1_context_randomize"
"_secp256k1_ec_seckey_verify"
"_secp256k1_ec_pubkey_create"
"_secp256k1_ec_pubkey_parse"
"_secp256k1_ec_pubkey_serialize"
"_secp256k1_ecdh"
"_secp256k1_ecdsa_signature_parse_compact"
"_secp256k1_ecdsa_signature_serialize_compact"
"_secp256k1_ecdsa_sign"
"_secp256k1_ecdsa_verify"
'''

# join list to string
sx_funcs=$(join "$s_exports" ',')

# clean
emmake make clean

# workaround for <https://github.com/emscripten-core/emscripten/issues/13551>
echo '{"type":"commonjs"}' > package.json

# autogen
./autogen.sh

# configure
emconfigure ./configure \
  --enable-module-ecdh \
  --enable-module-recovery \
  --enable-module-schnorrsig=no \
  --enable-module-ellswift=no \
  --enable-module-extrakeys=no \
  --with-ecmult-window=4 \
  --with-ecmult-gen-precision=2 \
  --disable-shared \
  CFLAGS="-fdata-sections -ffunction-sections -O2" \
  LDFLAGS="-Wl,--gc-sections"

# make
emmake make FORMAT=wasm
emmake make src/precompute_ecmult-precompute_ecmult FORMAT=wasm

# reset output dir
rm -rf out
mkdir -p out

# compile
emcc src/precompute_ecmult-precompute_ecmult.o \
  src/libsecp256k1_precomputed_la-precomputed_ecmult.o \
  src/libsecp256k1_precomputed_la-precomputed_ecmult_gen.o \
  src/libsecp256k1_la-secp256k1.o \
  -O2 \
  -s WASM=1 \
  -s "BINARYEN_METHOD='native-wasm'" \
  -s DETERMINISTIC=1 \
  -s EXPORTED_FUNCTIONS="[$sx_funcs]" \
  -s MINIMAL_RUNTIME=1 \
  -s NO_EXIT_RUNTIME=1 \
  -o out/secp256k1.js

# verify
ls -lah out/
