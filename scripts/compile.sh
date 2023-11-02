#!/bin/bash

EXTERNALIZE_SHA256=0

# parse options
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --externalize-sha256)
      EXTERNALIZE_SHA256=1
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
  shift
done

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

append_export() {
  s_append="$1"
  s_exports+="$s_append"$'\n'
}

if [[ $EXTERNALIZE_SHA256 -ne 0 ]]; then
  append_export '"_secp256k1_sha256_initialize"'
  append_export '"_secp256k1_sha256_write"'
  append_export '"_secp256k1_sha256_finalize"'
fi

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

# make sha256 external
if [[ $EXTERNALIZE_SHA256 -ne 0 ]]; then
  sed -i.bak 's/static \(void secp256k1_sha256_\(initialize\|write\|finalize\)\)/\1/' src/hash_impl.h 
  sed -i.bak 's/static \(void secp256k1_sha256_\(initialize\|write\|finalize\)\)/extern \1/' src/hash.h
else
  # undo any previous changes
  find src -type f -name "*.bak" | while read -r sr_bak; do
    sr_original="${sr_bak%.bak}"
    mv "$sr_bak" "$sr_original"
  done
fi

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
  -O3 \
  -s WASM=1 \
  -s TOTAL_MEMORY=$(( 64 * 1024 * 3 )) \
  -s "BINARYEN_METHOD='native-wasm'" \
  -s DETERMINISTIC=1 \
  -s EXPORTED_FUNCTIONS="[$sx_funcs]" \
  -s MINIMAL_RUNTIME=1 \
  -s NO_EXIT_RUNTIME=1 \
  -o out/secp256k1.js

# verify
ls -lah out/
