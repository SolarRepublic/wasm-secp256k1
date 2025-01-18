define USAGE
REQUIREMENTS:
- Powershell Core
- Docker
- Bun

USAGE:
> make [
	sense: see usage.
	clean: clean build artifacts, environment, cache, etc..

	build-container: build the docker image for WASM builder container.
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

# Define directories to remove
DIRS_TO_REMOVE = $(OUTPUT_DIR) $(NODE_MODULES) $(DOCKER_DIST) $(ROLLUP_CACHE)
# Define Unix-like command to remove directories
UNIX_RM = for dir in $(DIRS_TO_REMOVE); do [ -d "$$dir" ] && rm -rf $$dir; done
# Define Windows command to remove directories
WINDOWS_RM = for %%d in ($(DIRS_TO_REMOVE)) do if exist "%%~d" rmdir /s /q "%%~d"
# For Unix-like systems, use the UNIX_RM command
ifdef OS
  SHELL = /bin/bash
  CLEAN_CMD = $(UNIX_RM)
else
  ifeq ($(OS),Windows_NT)
    # For Windows, use cmd and the WINDOWS_RM command
    SHELL = cmd
    CLEAN_CMD = $(WINDOWS_RM)
  endif
endif

clean:
	@$(CLEAN_CMD)

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
