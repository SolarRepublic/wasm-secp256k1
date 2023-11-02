var Module=globalThis.Module||{};var ENVIRONMENT_IS_NODE=typeof process=="object";if(ENVIRONMENT_IS_NODE){var fs=require("fs");Module["wasm"]=fs.readFileSync(__dirname+"/secp256k1.wasm")}var out=text=>console.log(text);var err=text=>console.error(text);function ready(){}function abort(what){throw what}var HEAP8,HEAP16,HEAP32,HEAPU8,HEAPU16,HEAPU32,HEAPF32,HEAPF64,wasmMemory;function updateMemoryViews(){var b=wasmMemory.buffer;HEAP8=new Int8Array(b);HEAP16=new Int16Array(b);HEAPU8=new Uint8Array(b);HEAPU16=new Uint16Array(b);HEAP32=new Int32Array(b);HEAPU32=new Uint32Array(b);HEAPF32=new Float32Array(b);HEAPF64=new Float64Array(b)}var noExitRuntime=Module["noExitRuntime"]||true;var _abort=()=>{abort("")};var _emscripten_memcpy_js=(dest,src,num)=>HEAPU8.copyWithin(dest,src,src+num);var abortOnCannotGrowMemory=requestedSize=>{abort("OOM")};var _emscripten_resize_heap=requestedSize=>{var oldSize=HEAPU8.length;requestedSize>>>=0;abortOnCannotGrowMemory(requestedSize)};var UTF8Decoder=typeof TextDecoder!="undefined"?new TextDecoder("utf8"):undefined;var UTF8ArrayToString=(heapOrArray,idx,maxBytesToRead)=>{var endIdx=idx+maxBytesToRead;var endPtr=idx;while(heapOrArray[endPtr]&&!(endPtr>=endIdx))++endPtr;if(endPtr-idx>16&&heapOrArray.buffer&&UTF8Decoder){return UTF8Decoder.decode(heapOrArray.subarray(idx,endPtr))}var str="";while(idx<endPtr){var u0=heapOrArray[idx++];if(!(u0&128)){str+=String.fromCharCode(u0);continue}var u1=heapOrArray[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}var u2=heapOrArray[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2}else{u0=(u0&7)<<18|u1<<12|u2<<6|heapOrArray[idx++]&63}if(u0<65536){str+=String.fromCharCode(u0)}else{var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023)}}return str};var UTF8ToString=(ptr,maxBytesToRead)=>ptr?UTF8ArrayToString(HEAPU8,ptr,maxBytesToRead):"";var SYSCALLS={varargs:undefined,get(){var ret=HEAP32[+SYSCALLS.varargs>>2];SYSCALLS.varargs+=4;return ret},getp(){return SYSCALLS.get()},getStr(ptr){var ret=UTF8ToString(ptr);return ret}};var _fd_close=fd=>52;var convertI32PairToI53Checked=(lo,hi)=>hi+2097152>>>0<4194305-!!lo?(lo>>>0)+hi*4294967296:NaN;function _fd_seek(fd,offset_low,offset_high,whence,newOffset){var offset=convertI32PairToI53Checked(offset_low,offset_high);return 70}var printCharBuffers=[null,[],[]];var printChar=(stream,curr)=>{var buffer=printCharBuffers[stream];if(curr===0||curr===10){(stream===1?out:err)(UTF8ArrayToString(buffer,0));buffer.length=0}else{buffer.push(curr)}};var _fd_write=(fd,iov,iovcnt,pnum)=>{var num=0;for(var i=0;i<iovcnt;i++){var ptr=HEAPU32[iov>>2];var len=HEAPU32[iov+4>>2];iov+=8;for(var j=0;j<len;j++){printChar(fd,HEAPU8[ptr+j])}num+=len}HEAPU32[pnum>>2]=num;return 0};var wasmImports={a:_abort,f:_emscripten_memcpy_js,d:_emscripten_resize_heap,e:_fd_close,c:_fd_seek,b:_fd_write};function initRuntime(wasmExports){wasmExports["h"]()}var imports={"a":wasmImports};var _malloc,_free,_secp256k1_sha256_initialize,_secp256k1_sha256_write,_secp256k1_sha256_finalize,_secp256k1_context_create,_secp256k1_ec_pubkey_parse,_secp256k1_ec_pubkey_serialize,_secp256k1_ecdsa_signature_parse_compact,_secp256k1_ecdsa_signature_serialize_compact,_secp256k1_ecdsa_verify,_secp256k1_ecdsa_sign,_secp256k1_ec_seckey_verify,_secp256k1_ec_pubkey_create,_secp256k1_context_randomize,_secp256k1_ecdh,_sbrk;WebAssembly.instantiate(Module["wasm"],imports).then(output=>{var wasmExports=output.instance.exports;_malloc=wasmExports["i"];_free=wasmExports["j"];_secp256k1_sha256_initialize=wasmExports["l"];_secp256k1_sha256_write=wasmExports["m"];_secp256k1_sha256_finalize=wasmExports["n"];_secp256k1_context_create=wasmExports["o"];_secp256k1_ec_pubkey_parse=wasmExports["p"];_secp256k1_ec_pubkey_serialize=wasmExports["q"];_secp256k1_ecdsa_signature_parse_compact=wasmExports["r"];_secp256k1_ecdsa_signature_serialize_compact=wasmExports["s"];_secp256k1_ecdsa_verify=wasmExports["t"];_secp256k1_ecdsa_sign=wasmExports["u"];_secp256k1_ec_seckey_verify=wasmExports["v"];_secp256k1_ec_pubkey_create=wasmExports["w"];_secp256k1_context_randomize=wasmExports["x"];_secp256k1_ecdh=wasmExports["y"];_sbrk=wasmExports["sbrk"];wasmMemory=wasmExports["g"];updateMemoryViews();initRuntime(wasmExports);ready()});
