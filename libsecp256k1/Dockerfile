FROM emscripten/emsdk:4.0.0

RUN apt-get update && \
  apt-get install -y \
  autoconf \
  libtool \
  build-essential

COPY libsecp256k1 /build

WORKDIR /build/

RUN ./build.sh

CMD ["cp", "-r", "/build/dist", "/dist"]
