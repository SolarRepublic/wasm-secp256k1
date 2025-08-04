
// base64 character set
const SX_CHARS_BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Converts the given base64-encoded string to a buffer.
 * @param sb64_data input base64-encoded string
 * @returns output buffer
 */
export const base64_to_bytes = (sb64_data: string): Uint8Array<ArrayBuffer> => {
	// remove padding from string and normalize from URL-safe variant
	sb64_data = sb64_data.replace(/=+$/, '').replace(/[-_]/g, s => '-' === s? '+': '_' === s? '/': s);

	// a buffer to store decoded sextets
	let xb_work = 0;

	// number of bits in the buffer
	let nb_buffer = 0;

	// prep output values
	const a_out: number[] = [];

	// each character
	for(const s_char of sb64_data) {
		// decode character value
		const xb_char = SX_CHARS_BASE64.indexOf(s_char);

		// invalid base64-encoding
		if(-1 === xb_char) throw new Error('Invalid base64 string');

		// add 6 bits from index to buffer
		xb_work = (xb_work << 6) | xb_char;

		// increase size of buffer which checking if a whole byte exists in the buffer
		if((nb_buffer += 6) >= 8) {
			// move byte out of buffer
			a_out.push(xb_work >>> (nb_buffer -= 8));

			// trim the buffer
			xb_work &= (1 << nb_buffer) - 1;
		}
	}

	return new Uint8Array(a_out);
};

/**
 * Concatenate a sequence of Uint8Arrays.
 * @param a_buffers the data to concatenate in order
 * @returns the concatenated output Uint8Array
 */
export const concat = (a_buffers: readonly Uint8Array[]): Uint8Array<ArrayBuffer> => {
	const nb_out = a_buffers.reduce((c_bytes, atu8_each) => c_bytes + atu8_each.byteLength, 0);
	const atu8_out = new Uint8Array(nb_out);
	let ib_write = 0;
	for(const atu8_each of a_buffers) {
		atu8_out.set(atu8_each, ib_write);
		ib_write += atu8_each.byteLength;
	}

	return atu8_out;
};

