define USAGE
REQUIREMENTS:
- Powershell Core
- Docker
- Bun

USAGE:
> make [
	sense: see usage.
	clean: clean output dir.

	build-container: build the WASM builder container image.
	build: build the project.
	publish: publish to https://npm.pkg.github.com.
]
endef

#####################
# General Variables #
#####################
OS ?= $(shell uname -s | tr A-Z a-z)
PWD = $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
HEAD_COMMIT ?= $(shell git rev-parse HEAD)
OUTPUT_DIR ?= $(PWD)/dist
NODE_MODULES ?= $(PWD)/node_modules
ROLLUP_CACHE ?= $(PWD)/.rollup.cache
DOCKER_DIST ?= $(PWD)/.docker

###################
# General Targets #
###################
.PHONY: all sense clean build

all: sense
sense:
	$(info $(USAGE))

clean:
	@pwsh -Command 'if(Test-Path $(OUTPUT_DIR)){Remove-Item -Force -Recurse $(OUTPUT_DIR)}'
	@pwsh -Command 'if(Test-Path $(NODE_MODULES)){Remove-Item -Force -Recurse $(NODE_MODULES)}'
	@pwsh -Command 'if(Test-Path $(DOCKER_DIST)){Remove-Item -Force -Recurse $(DOCKER_DIST)}'
	@pwsh -Command 'if(Test-Path $(ROLLUP_CACHE)){Remove-Item -Force -Recurse $(ROLLUP_CACHE)}'

################
# Host Targets #
################
LIBSECP256K1_BUILDER_TAG = secp256k1-wasm-builder
LIBSECP256K1.WASM = $(PWD)/src/gen/secp256k1.wasm
LIBSECP256K1.JS = $(PWD)/src/gen/secp256k1.js
LIBSECP256K1.GLUE = $(PWD)/src/gen/glue.ts

$(DOCKER_DIST)/dist/secp256k1.wasm:
	@make build-container
	@docker run --rm -v $(DOCKER_DIST):/dist $(LIBSECP256K1_BUILDER_TAG)
$(DOCKER_DIST)/dist/secp256k1.js:
	@make build-container
	@docker run --rm -v $(DOCKER_DIST):/dist $(LIBSECP256K1_BUILDER_TAG)
$(OUTPUT_DIR):
	@mkdir -p $(OUTPUT_DIR)
$(LIBSECP256K1.WASM): $(DOCKER_DIST)/dist/secp256k1.wasm
	@cp $(DOCKER_DIST)/dist/secp256k1.wasm $(LIBSECP256K1.WASM)
$(LIBSECP256K1.JS): $(DOCKER_DIST)/dist/secp256k1.js
	@cp $(DOCKER_DIST)/dist/secp256k1.js $(LIBSECP256K1.JS)

$(LIBSECP256K1.GLUE): $(LIBSECP256K1.JS)
	@bun install acorn --no-save
	@bun run ./libsecp256k1/generate_glue.ts $(LIBSECP256K1.JS) > $(LIBSECP256K1.GLUE)
$(OUTPUT_DIR)/secp256k1.js: $(LIBSECP256K1.JS)
	@cp $(LIBSECP256K1.JS) $(OUTPUT_DIR)/secp256k1.js
$(OUTPUT_DIR)/secp256k1.wasm: $(LIBSECP256K1.WASM)
	@cp $(LIBSECP256K1.WASM) $(OUTPUT_DIR)/secp256k1.wasm

build-container:
	@docker build -f libsecp256k1/Dockerfile . -t $(LIBSECP256K1_BUILDER_TAG)

build: $(OUTPUT_DIR) $(LIBSECP256K1.JS) $(LIBSECP256K1.WASM) $(LIBSECP256K1.GLUE) $(OUTPUT_DIR)/secp256k1.js $(OUTPUT_DIR)/secp256k1.wasm
	@bun install --frozen-lockfile
	@bun run build

publish:
	@npm publish
