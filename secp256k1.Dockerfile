FROM emscripten/emsdk

RUN apt-get update \
  && apt-get install -y \
  autoconf \
  libtool \
  build-essential

COPY submodules/libsecp256k1 /app
COPY scripts/compile.sh /app

WORKDIR /app

RUN ./compile.sh

# copy outputs to mounted volume
CMD ["cp", "/app/out/secp256k1.js", "/app/out/secp256k1.wasm", "/out"]