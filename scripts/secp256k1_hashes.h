#ifndef SECP256K1_HASHES_H
#define SECP256K1_HASHES_H

#include "secp256k1.h"

#ifdef __cplusplus
extern "C" {
#endif

#include <stdlib.h>
#include <stdint.h>

/** Opaque data structured that holds a SHA-256 hash.
 */
typedef struct {
    uint32_t s[8];
    unsigned char buf[64];
    uint64_t bytes;
} secp256k1_sha256;

/** Initialize a SHA-256 hash object.
 * 
 * Returns: void
 * Args: hash:   a pointer to a byte array to place the object in.
*/
SECP256K1_API void secp256k1_sha256_initialize(
    secp256k1_sha256 *hash
) SECP256K1_ARG_NONNULL(1);

/** Writes data to the SHA-256 hash object
 * 
 * Returns: void
 * Args: hash:   a secp256k1 sha256 hash object.
 * In:   data:   message bytes to add to the stream cipher.
 *       len:    length of the message.
*/
SECP256K1_API void secp256k1_sha256_write(
    secp256k1_sha256 *hash,
    const unsigned char *data,
    size_t len
) SECP256K1_ARG_NONNULL(1) SECP256K1_ARG_NONNULL(2);

/** Serialize an ECDSA signature in compact format (64 bytes + recovery id).
 *
 *  Returns: void
 *  Args: hash:   a secp256k1 sha256 hash object.
 *  Out:  out32:  a pointer to a 32-byte array to store the digest.
 */
SECP256K1_API void secp256k1_sha256_finalize(
    secp256k1_sha256 *hash,
    unsigned char *out32
) SECP256K1_ARG_NONNULL(1) SECP256K1_ARG_NONNULL(2);

#ifdef __cplusplus
}
#endif

#endif /* SECP256K1_H */
