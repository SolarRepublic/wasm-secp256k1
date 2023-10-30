emcc src/wrapper.c \
	-Isubmodules/libsecp256k1/include \
	-O3 \
	-s WASM=1 \
	-s "BINARYEN_METHOD='native-wasm'" \
	-s NO_EXIT_RUNTIME=1 \
	-s DETERMINISTIC=1 \
	-s EXPORTED_FUNCTIONS='[ \
	"_malloc", \
	"_free", \
	"_sign_message", \
	"_verify_signature" \
	"_secp256k1_context_create", \
	"_secp256k1_context_randomize", \
	"_secp256k1_ec_seckey_verify", \
	"_secp256k1_ec_privkey_tweak_add", \
	"_secp256k1_ec_privkey_tweak_mul", \
	"_secp256k1_ec_pubkey_create", \
	"_secp256k1_ec_pubkey_parse", \
	"_secp256k1_ec_pubkey_serialize", \
	"_secp256k1_ec_pubkey_tweak_add", \
	"_secp256k1_ec_pubkey_tweak_mul", \
	"_secp256k1_ecdh", \
	"_secp256k1_ecdsa_recover", \
	"_secp256k1_ecdsa_recoverable_signature_serialize_compact", \
	"_secp256k1_ecdsa_recoverable_signature_parse_compact", \
	"_secp256k1_ecdsa_sign", \
	"_secp256k1_ecdsa_signature_normalize", \
	"_secp256k1_ecdsa_signature_parse_der", \
	"_secp256k1_ecdsa_signature_parse_compact", \
	"_secp256k1_ecdsa_signature_serialize_der", \
	"_secp256k1_ecdsa_signature_serialize_compact", \
	"_secp256k1_ecdsa_sign_recoverable", \
	"_secp256k1_ecdsa_verify", \
	"_secp256k1_schnorrsig_sign", \
	"_secp256k1_schnorrsig_verify" \
	]' \
	-o build/secp256k1.js
