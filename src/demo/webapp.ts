import {buffer_to_hex, hex_to_buffer, sha256, text_to_buffer} from '@blake.regalia/belt';

import {WasmSecp256k1} from '../api/secp256k1';

const d_res = await fetch('out/secp256k1.wasm');
const k_secp = await WasmSecp256k1(d_res);

const atu8_sk = hex_to_buffer('30fd578ae6857f09edc4567f1c8ba6039a088c978610551e19f8d31f455345ae');

const atu8_pk = k_secp.sk_to_pk(atu8_sk);

console.log(`pubkey: ${buffer_to_hex(atu8_pk)}`);

const atu8_pk_other = hex_to_buffer('03f7f143dd09cb194fb07f07c524646a941b7f03425728f54cb124aa23768218da');

const atu8_shared = k_secp.ecdh(atu8_sk, atu8_pk_other);
const sb16_shared = buffer_to_hex(atu8_shared);

const sb16_expect = '03f852cd3aea28f579544ab3a4cf4e043ff453c77dbebe09cafe66ecd9c767592a';

console.log(sb16_shared);
console.log(sb16_expect);

console.log(sb16_expect === sb16_shared);



const A_VECTORS = [
	{
		sk: hex_to_buffer('ebb2c082fd7727890a28ac82f6bdf97bad8de9f5d7c9028692de1a255cad3e0f'),
		msg: await sha256(text_to_buffer('Test message')),
	},
	{
		sk: hex_to_buffer('0000000000000000000000000000000000000000000000000000000000000002'),
		msg: await sha256(text_to_buffer('Test message')),
	},
];

