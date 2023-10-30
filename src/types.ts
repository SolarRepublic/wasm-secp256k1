
export type Pointer = number;
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

export type ImportMapper = (g_imports: WasmImports) => WebAssembly.Imports;
