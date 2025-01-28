EXTENSION_DIR = "blocker@pesader.dev"
EXTENSION_ARCHIVE = "$(EXTENSION_DIR).shell-extension.zip"

all: build install

.PHONY: build install run clean lint lint-fix lint-install docs docs-install

build:
	gnome-extensions pack --force --extra-source=icons --extra-source=modules $(EXTENSION_DIR)

install: build
	gnome-extensions install $(EXTENSION_ARCHIVE) --force

run:
	env MUTTER_DEBUG_DUMMY_MODE_SPECS=1256x768 dbus-run-session -- gnome-shell --nested --wayland

clean:
	rm $(EXTENSION_ARCHIVE)

lint:
	npx eslint "**/*.js" --no-warn-ignored

lint-fix:
	npx eslint "**/*.js" --no-warn-ignored --fix

lint-install:
	npm install --user eslint@9.19.0 eslint-plugin-jsdoc --save-dev

docs:
	mkdir -p docs/
	cp -r assets/ docs/
	npx jsdoc -c jsdoc.json

docs-install:
	npm install jsdoc --save-dev
