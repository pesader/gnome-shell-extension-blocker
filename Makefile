EXTENSION_DIR = "blocker@pesader.dev"
EXTENSION_ARCHIVE = "$(EXTENSION_DIR).shell-extension.zip"
SHELL_VERSION ?= 50

all: build install

.PHONY: build install run clean lint eslint-lint eslint-fix eslint-install shexli-lint shexli-install docs docs-install pot

build:
	gnome-extensions pack --force --podir=po --extra-source=icons --extra-source=modules $(EXTENSION_DIR)

install: build
	gnome-extensions install $(EXTENSION_ARCHIVE) --force

run: install
	./scripts/run-gnome-shell.sh --toolbox=gnome-shell-$(SHELL_VERSION)

clean:
	rm -f $(EXTENSION_ARCHIVE)
	rm -rf docs/

eslint-install:
	pnpm add -D eslint@9.19.0 eslint-plugin-jsdoc

eslint-lint: eslint-install
	pnpm exec eslint "$(EXTENSION_DIR)/**/*.js" --no-warn-ignored

eslint-fix: eslint-install
	pnpm exec eslint "$(EXTENSION_DIR)/**/*.js" --no-warn-ignored --fix

shexli-install:
	uv sync

shexli-lint: shexli-install build
	uv run shexli ${EXTENSION_ARCHIVE}

lint:
	@echo "Running ESLint..."
	@$(MAKE) eslint-lint
	@echo ""
	@echo "Running Shexli..."
	@$(MAKE) shexli-lint

docs: docs-install
	mkdir -p docs/
	cp -r assets/ docs/
	pnpm exec jsdoc -c jsdoc.json

docs-install:
	pnpm add -D jsdoc docdash

pot:
	xgettext --language=JavaScript --from-code=UTF-8 --output=blocker@pesader.dev/po/blocker@pesader.dev.pot --add-comments=TRANSLATORS $(shell find . -name "*.js" -not -path "./node_modules/*")
