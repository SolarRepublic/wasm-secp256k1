import type {RecoveryValue} from '../api/secp256k1-types';

import {bytes_to_hex, hex_to_bytes, sha256, text_to_bytes} from '@blake.regalia/belt';

import {WasmSecp256k1} from '../api/secp256k1';

const elem = <d_type extends HTMLElement=HTMLElement>(si_id: string) => document.getElementById(si_id) as d_type;

const dm_sk = elem<HTMLInputElement>('sk');
const dm_pk = elem<HTMLInputElement>('pk');
const dm_pkr = elem<HTMLInputElement>('pkr');
const dm_v = elem<HTMLInputElement>('v');
const dm_msg = elem<HTMLInputElement>('msg');
const dm_hash = elem<HTMLTextAreaElement>('hash');
const dm_sig_r = elem<HTMLInputElement>('sig_r');
const dm_sig_s = elem<HTMLInputElement>('sig_s');
const dm_verified = elem<HTMLInputElement>('verified');

(async function load() {
	const d_res = await fetch('out/secp256k1.wasm');
	const k_secp = await WasmSecp256k1(d_res);

	let atu8_sk: Uint8Array;
	let atu8_pk: Uint8Array;
	let atu8_hash: Uint8Array;
	let atu8_sig: Uint8Array;
	let xc_recovery: RecoveryValue;
	let atu8_pkr: Uint8Array;

	function sk_err(s_msg: string) {
		dm_pk.value = s_msg;
		dm_hash.value = dm_sig_r.value = dm_sig_s.value = dm_verified.value = '';
	}

	const is_hex = (sb16: string) => /^[a-f0-9]+$/i.test(sb16);

	function reload_sk() {
		const sb16_sk = dm_sk.value;
		if(sb16_sk.length < 64) {
			return sk_err('Private key too short');
		}
		else if(sb16_sk.length > 64) {
			return sk_err('Private key too long');
		}
		else if(!is_hex(sb16_sk)) {
			return sk_err('Not hexadecimal');
		}

		atu8_sk = hex_to_bytes(sb16_sk);

		try {
			atu8_pk = k_secp.sk_to_pk(atu8_sk);
		}
		catch(e_convert) {
			return sk_err((e_convert as Error).message);
		}

		dm_pk.value = bytes_to_hex(atu8_pk);

		void reload_sig();
	}

	async function reload_sig() {
		atu8_hash = await sha256(text_to_bytes(dm_msg.value));

		dm_hash.value = bytes_to_hex(atu8_hash);

		try {
			[atu8_sig, xc_recovery] = k_secp.sign(atu8_sk, atu8_hash);
		}
		catch(e_convert) {
			return dm_sig_r.value = (e_convert as Error).message;
		}

		dm_sig_r.value = bytes_to_hex(atu8_sig.subarray(0, 32));
		dm_sig_s.value = bytes_to_hex(atu8_sig.subarray(32));
		dm_v.value = xc_recovery+'';

		try {
			k_secp.verify(atu8_sig, atu8_hash, atu8_pk);
		}
		catch(e_verify) {
			return dm_verified.value = (e_verify as Error).message;
		}

		try {
			atu8_pkr = k_secp.recover(atu8_sig, atu8_hash, xc_recovery);
		}
		catch(e_recover) {
			return dm_verified.value = (e_recover as Error).message;
		}

		if(bytes_to_hex(atu8_pk) !== bytes_to_hex(atu8_pkr)) {
			return dm_verified.value = `Recovered public keys do not match!`;
		}

		dm_pkr.value = bytes_to_hex(atu8_pkr);

		dm_verified.value = 'Yes';
	}

	// generate random private key
	atu8_sk = k_secp.gen_sk();

	// set value in UI
	dm_sk.value = bytes_to_hex(atu8_sk);

	// bind to input events
	dm_sk.addEventListener('input', reload_sk);
	dm_msg.addEventListener('input', reload_sig);

	// init
	reload_sk();
})();
