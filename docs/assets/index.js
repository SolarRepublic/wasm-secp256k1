(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const assign = Object.assign;
const die = (s_msg, w_data) => {
  throw assign(Error(s_msg), { data: w_data });
};
const SI_HASH_ALGORITHM_SHA256 = "SHA-256";
const bytes$1 = (...a_args) => new Uint8Array(...a_args);
const sha256 = async (atu8_data) => bytes$1(await crypto.subtle.digest(SI_HASH_ALGORITHM_SHA256, atu8_data));
const text_to_bytes = (s_text) => new TextEncoder().encode(s_text);
const bytes_to_hex = (atu8_buffer) => atu8_buffer.reduce((s_out, xb_byte) => s_out + xb_byte.toString(16).padStart(2, "0"), "");
const hex_to_bytes = (sx_hex) => bytes$1(sx_hex.length / 2).map((xb_ignore, i_char) => parseInt(sx_hex.slice(i_char * 2, i_char * 2 + 2), 16));
const bytes_to_stream = (atu8) => new Response(atu8).body;
const pipe_bytes_through = (atu8, d_pair) => bytes_to_stream(atu8).pipeThrough(d_pair);
const stream_to_bytes = async (d_stream) => bytes$1(await new Response(d_stream).arrayBuffer());
const transcompress_bytes_gzip = (atu8, d_stream) => stream_to_bytes(pipe_bytes_through(atu8, new d_stream("gzip")));
const [gzip_bytes, gunzip_bytes] = typeof CompressionStream > "t" ? typeof Bun > "t" ? die("gzip (de)compression not available in current environment") : [
  Bun.gzipSync,
  Bun.gunzipSync
] : [
  (atu8) => transcompress_bytes_gzip(atu8, CompressionStream),
  (atu8) => transcompress_bytes_gzip(atu8, DecompressionStream)
];
const emsimp = (f_map_imports, s_tag) => {
  s_tag += ": ";
  let AB_HEAP;
  let ATU8_HEAP;
  let ATU32_HEAP;
  const console_out = (s_channel, s_out) => console[s_channel](s_tag + s_out.replace(/\0/g, "\n"));
  let s_error = "";
  const h_fds = {
    // stdout
    1(s_out) {
      console_out("debug", s_out);
    },
    // stderr
    2(s_out) {
      console_out("error", s_error = s_out);
    }
  };
  const g_imports = f_map_imports({
    abort() {
      throw Error(s_tag + (s_error || "An unknown error occurred"));
    },
    memcpy: (ip_dst, ip_src, nb_size) => ATU8_HEAP.copyWithin(ip_dst, ip_src, ip_src + nb_size),
    resize(nb_size) {
      throw Error(s_tag + "Out of memory");
    },
    write(i_fd, ip_iov, nl_iovs, ip_written) {
      let s_out = "";
      let cb_read = 0;
      for (let i_iov = 0; i_iov < nl_iovs; i_iov++) {
        const ip_start = ATU32_HEAP[ip_iov >> 2];
        const nb_len = ATU32_HEAP[ip_iov + 4 >> 2];
        ip_iov += 8;
        s_out += new TextDecoder().decode(ATU8_HEAP.subarray(ip_start, ip_start + nb_len));
        cb_read += nb_len;
      }
      if (h_fds[i_fd]) {
        h_fds[i_fd](s_out);
      } else {
        throw new Error(`libsecp256k1 tried writing to non-open file descriptor: ${i_fd}
${s_out}`);
      }
      ATU32_HEAP[ip_written >> 2] = cb_read;
      return 0;
    }
  });
  return [g_imports, (d_memory) => [
    AB_HEAP = d_memory.buffer,
    ATU8_HEAP = new Uint8Array(AB_HEAP),
    ATU32_HEAP = new Uint32Array(AB_HEAP)
  ]];
};
var ByteLens = /* @__PURE__ */ ((ByteLens2) => {
  ByteLens2[ByteLens2["RANDOM_SEED"] = 32] = "RANDOM_SEED";
  ByteLens2[ByteLens2["PRIVATE_KEY"] = 32] = "PRIVATE_KEY";
  ByteLens2[ByteLens2["ECDH_SHARED_SK"] = 32] = "ECDH_SHARED_SK";
  ByteLens2[ByteLens2["PUBLIC_KEY_COMPRESSED"] = 33] = "PUBLIC_KEY_COMPRESSED";
  ByteLens2[ByteLens2["PUBLIC_KEY_LIB"] = 64] = "PUBLIC_KEY_LIB";
  ByteLens2[ByteLens2["PUBLIC_KEY_UNCOMPRESSED"] = 65] = "PUBLIC_KEY_UNCOMPRESSED";
  ByteLens2[ByteLens2["PUBLIC_KEY_MAX"] = 65] = "PUBLIC_KEY_MAX";
  ByteLens2[ByteLens2["ECDSA_SIG_COMPACT"] = 64] = "ECDSA_SIG_COMPACT";
  ByteLens2[ByteLens2["ECDSA_SIG_LIB"] = 64] = "ECDSA_SIG_LIB";
  ByteLens2[ByteLens2["ECDSA_SIG_RECOVERABLE"] = 65] = "ECDSA_SIG_RECOVERABLE";
  ByteLens2[ByteLens2["MSG_HASH"] = 32] = "MSG_HASH";
  ByteLens2[ByteLens2["NONCE_ENTROPY"] = 32] = "NONCE_ENTROPY";
  ByteLens2[ByteLens2["SHA256"] = 104] = "SHA256";
  return ByteLens2;
})(ByteLens || {});
var Flags = /* @__PURE__ */ ((Flags2) => {
  Flags2[Flags2["CONTEXT_NONE"] = 1] = "CONTEXT_NONE";
  Flags2[Flags2["CONTEXT_VERIFY"] = 257] = "CONTEXT_VERIFY";
  Flags2[Flags2["CONTEXT_SIGN"] = 513] = "CONTEXT_SIGN";
  Flags2[Flags2["CONTEXT_DECLASSIFY"] = 1025] = "CONTEXT_DECLASSIFY";
  Flags2[Flags2["COMPRESSION_UNCOMPRESSED"] = 2] = "COMPRESSION_UNCOMPRESSED";
  Flags2[Flags2["COMPRESSION_COMPRESSED"] = 258] = "COMPRESSION_COMPRESSED";
  return Flags2;
})(Flags || {});
var BinaryResult = /* @__PURE__ */ ((BinaryResult2) => {
  BinaryResult2[BinaryResult2["SUCCESS"] = 1] = "SUCCESS";
  BinaryResult2[BinaryResult2["FAILURE"] = 0] = "FAILURE";
  return BinaryResult2;
})(BinaryResult || {});
const map_wasm_imports = (g_imports) => ({
  a: {
    f: g_imports.abort,
    e: g_imports.memcpy,
    c: g_imports.resize,
    d: () => 52,
    // _fd_close,
    b: () => 70,
    // _fd_seek,
    a: g_imports.write
  }
});
const map_wasm_exports = (g_exports) => ({
  malloc: g_exports["i"],
  free: g_exports["j"],
  context_create: g_exports["l"],
  ec_pubkey_parse: g_exports["m"],
  ec_pubkey_serialize: g_exports["n"],
  ecdsa_signature_parse_compact: g_exports["o"],
  ecdsa_verify: g_exports["p"],
  ec_seckey_verify: g_exports["q"],
  ec_pubkey_create: g_exports["r"],
  ec_seckey_tweak_add: g_exports["s"],
  ec_pubkey_tweak_add: g_exports["t"],
  ec_seckey_tweak_mul: g_exports["u"],
  ec_pubkey_tweak_mul: g_exports["v"],
  context_randomize: g_exports["w"],
  ecdh: g_exports["x"],
  ecdsa_recoverable_signature_parse_compact: g_exports["y"],
  ecdsa_recoverable_signature_serialize_compact: g_exports["z"],
  ecdsa_sign_recoverable: g_exports["A"],
  ecdsa_recover: g_exports["B"],
  memory: g_exports["g"],
  init: () => g_exports["h"]()
});
const S_TAG_ECDH = "ECDH: ";
const S_TAG_ECDSA_VERIFY = "ECDSA verify: ";
const S_TAG_TWEAK_ADD = "k tweak add: ";
const S_TAG_TWEAK_MUL = "k tweak mul: ";
const S_REASON_INVALID_SK = "Invalid private key";
const S_REASON_INVALID_PK = "Invalid public key";
const S_REASON_UNPARSEABLE_SIG = "Unparseable signature";
const bytes = (nb_bytes) => new Uint8Array(nb_bytes);
const random_32 = () => crypto.getRandomValues(bytes(32));
const WasmSecp256k1 = async (z_src) => {
  const [g_imports, f_bind_heap] = emsimp(map_wasm_imports, "wasm-secp256k1");
  let d_wasm;
  if (z_src instanceof Response || z_src instanceof Promise) {
    d_wasm = await WebAssembly.instantiateStreaming(z_src, g_imports);
  } else {
    d_wasm = await WebAssembly.instantiate(z_src, g_imports);
  }
  const g_wasm = map_wasm_exports(d_wasm.instance.exports);
  const [, ATU8_HEAP, ATU32_HEAP] = f_bind_heap(g_wasm.memory);
  g_wasm.init();
  const malloc = g_wasm.malloc;
  const ip_sk = malloc(ByteLens.PRIVATE_KEY);
  const ip_ent = malloc(ByteLens.NONCE_ENTROPY);
  const ip_seed = malloc(ByteLens.RANDOM_SEED);
  const ip_sk_shared = malloc(ByteLens.ECDH_SHARED_SK);
  const ip_msg_hash = malloc(ByteLens.MSG_HASH);
  const ip_sig_scratch = malloc(ByteLens.ECDSA_SIG_COMPACT);
  const ip_pk_scratch = malloc(ByteLens.PUBLIC_KEY_MAX);
  const ip_pk_lib = malloc(ByteLens.PUBLIC_KEY_LIB);
  const ip_sig_lib = malloc(ByteLens.ECDSA_SIG_LIB);
  const ip_sig_rcvr_lib = malloc(ByteLens.ECDSA_SIG_RECOVERABLE);
  const ip_v = malloc(4);
  const ip_ctx = g_wasm.context_create(Flags.CONTEXT_SIGN | Flags.CONTEXT_VERIFY);
  const ip_len = g_wasm.malloc(4);
  const ip32_len = ip_len >> 2;
  const put_bytes = (atu8_data, ip_write, nb_size) => {
    const atu8_buffer = bytes(nb_size);
    atu8_buffer.set(atu8_data);
    ATU8_HEAP.set(atu8_buffer, ip_write);
  };
  const randomize_context = () => {
    put_bytes(random_32(), ip_seed, ByteLens.RANDOM_SEED);
    if (BinaryResult.SUCCESS !== g_wasm.context_randomize(ip_ctx, ip_seed)) {
      throw Error("Failed to randomize context");
    }
  };
  const parse_pubkey = (atu8_pk) => {
    put_bytes(atu8_pk, ip_pk_scratch, ByteLens.PUBLIC_KEY_MAX);
    return BinaryResult.SUCCESS === g_wasm.ec_pubkey_parse(ip_ctx, ip_pk_lib, ip_pk_scratch, atu8_pk.length);
  };
  const with_sk = (atu8_sk, f_use) => {
    let w_return;
    try {
      put_bytes(atu8_sk, ip_sk, ByteLens.PRIVATE_KEY);
      w_return = f_use();
    } finally {
      ATU8_HEAP.fill(0, ip_sk, ip_sk + ByteLens.PRIVATE_KEY);
    }
    return w_return;
  };
  const get_pk = (b_uncompressed = false) => {
    const nb_pk = b_uncompressed ? ByteLens.PUBLIC_KEY_UNCOMPRESSED : ByteLens.PUBLIC_KEY_COMPRESSED;
    ATU32_HEAP[ip32_len] = nb_pk;
    const xm_compression = b_uncompressed ? Flags.COMPRESSION_UNCOMPRESSED : Flags.COMPRESSION_COMPRESSED;
    g_wasm.ec_pubkey_serialize(ip_ctx, ip_pk_scratch, ip_len, ip_pk_lib, xm_compression);
    return ATU8_HEAP.slice(ip_pk_scratch, ip_pk_scratch + nb_pk);
  };
  const valid_sk = (atu8_sk) => {
    if (with_sk(atu8_sk, () => ByteLens.PRIVATE_KEY !== atu8_sk.length || BinaryResult.SUCCESS !== g_wasm.ec_seckey_verify(ip_ctx, ip_sk))) {
      throw Error(S_REASON_INVALID_SK);
    }
    return atu8_sk;
  };
  const tweak_sk = (f_tweak, s_tag) => (atu8_sk, atu8_tweak) => {
    randomize_context();
    put_bytes(atu8_sk, ip_sk, ByteLens.PRIVATE_KEY);
    put_bytes(atu8_tweak, ip_msg_hash, ByteLens.MSG_HASH);
    if (BinaryResult.SUCCESS !== f_tweak(ip_ctx, ip_sk, ip_msg_hash)) {
      atu8_sk.fill(0);
      throw Error("s" + s_tag + S_REASON_INVALID_SK);
    }
    return ATU8_HEAP.slice(ip_sk, ip_sk + ByteLens.PRIVATE_KEY);
  };
  const apply_pk = (s_tag, atu8_pk, b_uncompressed, f_tweak, atu8_tweak) => {
    if (!parse_pubkey(atu8_pk)) {
      throw Error(s_tag + S_REASON_INVALID_PK);
    }
    put_bytes(atu8_pk, ip_pk_scratch, ByteLens.PUBLIC_KEY_MAX);
    if (f_tweak) {
      put_bytes(atu8_tweak, ip_msg_hash, ByteLens.MSG_HASH);
      if (BinaryResult.SUCCESS !== f_tweak(ip_ctx, ip_pk_lib, ip_msg_hash)) {
        throw Error("p" + s_tag + S_REASON_INVALID_PK);
      }
    }
    return get_pk(b_uncompressed);
  };
  const tweak_pk = (f_tweak, s_tag) => (atu8_pk, atu8_tweak, b_uncompressed = false) => apply_pk(s_tag, atu8_pk, b_uncompressed, f_tweak, atu8_tweak);
  return {
    gen_sk: () => valid_sk(crypto.getRandomValues(bytes(ByteLens.PRIVATE_KEY))),
    valid_sk,
    sk_to_pk(atu8_sk, b_uncompressed = false) {
      randomize_context();
      if (BinaryResult.SUCCESS !== with_sk(atu8_sk, () => g_wasm.ec_pubkey_create(ip_ctx, ip_pk_lib, ip_sk))) {
        throw Error("sk_to_pk: " + S_REASON_INVALID_SK);
      }
      return get_pk(b_uncompressed);
    },
    sign(atu8_sk, atu8_hash, atu8_ent = random_32()) {
      randomize_context();
      put_bytes(atu8_hash, ip_msg_hash, ByteLens.MSG_HASH);
      put_bytes(atu8_ent, ip_ent, ByteLens.NONCE_ENTROPY);
      if (BinaryResult.SUCCESS !== with_sk(atu8_sk, () => g_wasm.ecdsa_sign_recoverable(
        ip_ctx,
        ip_sig_rcvr_lib,
        ip_msg_hash,
        ip_sk,
        0,
        ip_ent
      ))) {
        throw Error("ECDSA sign: " + S_REASON_INVALID_SK);
      }
      g_wasm.ecdsa_recoverable_signature_serialize_compact(ip_ctx, ip_sig_scratch, ip_v, ip_sig_rcvr_lib);
      return [
        ATU8_HEAP.slice(ip_sig_scratch, ip_sig_scratch + ByteLens.ECDSA_SIG_COMPACT),
        ATU8_HEAP[ip_v]
        // terminal byte of 32-bit uint
      ];
    },
    verify(atu8_signature, atu8_hash, atu8_pk) {
      put_bytes(atu8_signature, ip_sig_scratch, ByteLens.ECDSA_SIG_COMPACT);
      put_bytes(atu8_hash, ip_msg_hash, ByteLens.MSG_HASH);
      if (!parse_pubkey(atu8_pk)) {
        throw Error(S_TAG_ECDSA_VERIFY + S_REASON_INVALID_PK);
      }
      if (BinaryResult.SUCCESS !== g_wasm.ecdsa_signature_parse_compact(ip_ctx, ip_sig_lib, ip_sig_scratch)) {
        throw Error(S_TAG_ECDSA_VERIFY + S_REASON_UNPARSEABLE_SIG);
      }
      return BinaryResult.SUCCESS === g_wasm.ecdsa_verify(ip_ctx, ip_sig_lib, ip_msg_hash, ip_pk_lib);
    },
    recover(atu8_signature, atu8_hash, xc_recovery, b_uncompressed = false) {
      put_bytes(atu8_signature, ip_sig_scratch, ByteLens.ECDSA_SIG_COMPACT);
      if (BinaryResult.SUCCESS !== g_wasm.ecdsa_recoverable_signature_parse_compact(ip_ctx, ip_sig_rcvr_lib, ip_sig_scratch, xc_recovery)) {
        throw Error(S_TAG_ECDSA_VERIFY + S_REASON_UNPARSEABLE_SIG);
      }
      put_bytes(atu8_hash, ip_msg_hash, ByteLens.MSG_HASH);
      if (BinaryResult.SUCCESS !== g_wasm.ecdsa_recover(ip_ctx, ip_pk_lib, ip_sig_rcvr_lib, ip_msg_hash)) {
        throw Error(S_TAG_ECDSA_VERIFY + "Invalid signature");
      }
      return get_pk(b_uncompressed);
    },
    ecdh(atu8_sk, atu8_pk) {
      if (!parse_pubkey(atu8_pk)) throw Error(S_TAG_ECDH + S_REASON_INVALID_PK);
      return with_sk(atu8_sk, () => {
        if (BinaryResult.SUCCESS !== g_wasm.ecdh(ip_ctx, ip_sk_shared, ip_pk_lib, ip_sk)) {
          throw Error(S_TAG_ECDH + S_REASON_INVALID_SK);
        }
        return ATU8_HEAP.slice(ip_sk_shared, ip_sk_shared + ByteLens.ECDH_SHARED_SK);
      });
    },
    tweak_sk_add: tweak_sk(g_wasm.ec_seckey_tweak_add, S_TAG_TWEAK_ADD),
    tweak_sk_mul: tweak_sk(g_wasm.ec_seckey_tweak_mul, S_TAG_TWEAK_MUL),
    tweak_pk_add: tweak_pk(g_wasm.ec_pubkey_tweak_add, S_TAG_TWEAK_ADD),
    tweak_pk_mul: tweak_pk(g_wasm.ec_pubkey_tweak_mul, S_TAG_TWEAK_MUL),
    reformat_pk: (atu8_pk, b_uncompressed = false) => apply_pk("Reformat pk: ", atu8_pk, b_uncompressed)
  };
};
const elem = (si_id) => document.getElementById(si_id);
const dm_sk = elem("sk");
const dm_pk = elem("pk");
const dm_pkr = elem("pkr");
const dm_v = elem("v");
const dm_msg = elem("msg");
const dm_hash = elem("hash");
const dm_sig_r = elem("sig_r");
const dm_sig_s = elem("sig_s");
const dm_verified = elem("verified");
(async function load() {
  const d_res = await fetch("out/secp256k1.wasm");
  const k_secp = await WasmSecp256k1(d_res);
  let atu8_sk;
  let atu8_pk;
  let atu8_hash;
  let atu8_sig;
  let xc_recovery;
  let atu8_pkr;
  function sk_err(s_msg) {
    dm_pk.value = s_msg;
    dm_hash.value = dm_sig_r.value = dm_sig_s.value = dm_verified.value = "";
  }
  const is_hex = (sb16) => /^[a-f0-9]+$/i.test(sb16);
  function reload_sk() {
    const sb16_sk = dm_sk.value;
    if (sb16_sk.length < 64) {
      return sk_err("Private key too short");
    } else if (sb16_sk.length > 64) {
      return sk_err("Private key too long");
    } else if (!is_hex(sb16_sk)) {
      return sk_err("Not hexadecimal");
    }
    atu8_sk = hex_to_bytes(sb16_sk);
    try {
      atu8_pk = k_secp.sk_to_pk(atu8_sk);
    } catch (e_convert) {
      return sk_err(e_convert.message);
    }
    dm_pk.value = bytes_to_hex(atu8_pk);
    void reload_sig();
  }
  async function reload_sig() {
    atu8_hash = await sha256(text_to_bytes(dm_msg.value));
    dm_hash.value = bytes_to_hex(atu8_hash);
    try {
      [atu8_sig, xc_recovery] = k_secp.sign(atu8_sk, atu8_hash);
    } catch (e_convert) {
      return dm_sig_r.value = e_convert.message;
    }
    dm_sig_r.value = bytes_to_hex(atu8_sig.subarray(0, 32));
    dm_sig_s.value = bytes_to_hex(atu8_sig.subarray(32));
    dm_v.value = xc_recovery + "";
    try {
      k_secp.verify(atu8_sig, atu8_hash, atu8_pk);
    } catch (e_verify) {
      return dm_verified.value = e_verify.message;
    }
    try {
      atu8_pkr = k_secp.recover(atu8_sig, atu8_hash, xc_recovery);
    } catch (e_recover) {
      return dm_verified.value = e_recover.message;
    }
    if (bytes_to_hex(atu8_pk) !== bytes_to_hex(atu8_pkr)) {
      return dm_verified.value = `Recovered public keys do not match!`;
    }
    dm_pkr.value = bytes_to_hex(atu8_pkr);
    dm_verified.value = "Yes";
  }
  atu8_sk = k_secp.gen_sk();
  dm_sk.value = bytes_to_hex(atu8_sk);
  dm_sk.addEventListener("input", reload_sk);
  dm_msg.addEventListener("input", reload_sig);
  reload_sk();
})();
//# sourceMappingURL=index.js.map
