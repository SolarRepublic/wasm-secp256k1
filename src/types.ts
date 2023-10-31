
export type Pointer<
	w_subtype=unknown,
> = number & {
	POINTER_TYPE: w_subtype;
};

export type ByteSize = number;
export type ByteDelta = number;
export type ByteOffset = number;
export type FileDescriptor = number;
export type SeekWhence = number;

export interface WasmImports {
	abort: () => void;
	memcpy: (ip_dst: Pointer, ip_src: Pointer, nb_size: ByteSize) => Uint8Array;
	resize: (nb_size: ByteSize) => void;
	write: (i_fd: FileDescriptor, ip_iov: Pointer, nl_iovs: number, ip_written: Pointer) => 0;
}

export interface WasmExports {
	malloc: <
		w_pointer_type extends Pointer,
		nb_size extends ByteSize=ByteSize,
	>(nb_size: nb_size) => Pointer extends w_pointer_type? Pointer<nb_size>: w_pointer_type;
	free: (ip_ptr: Pointer) => void;
	sbrk: (nb_change: ByteDelta) => Pointer;
	memory: WebAssembly.Memory;
	init: VoidFunction;
}

export type ImportMapper = (g_imports: WasmImports) => WebAssembly.Imports;
