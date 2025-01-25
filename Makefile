EXTENSION_DIR = "blocker@pesader.dev"
EXTENSION_ARCHIVE = "$(EXTENSION_DIR).shell-extension.zip"

all: build install

.PHONY: build install run clean lint lint-fix

build:
	gnome-extensions pack --force --extra-source=icons --extra-source=modules $(EXTENSION_DIR)

install: build
	gnome-extensions install $(EXTENSION_ARCHIVE) --force

run:
	env MUTTER_DEBUG_DUMMY_MODE_SPECS=1256x768 dbus-run-session -- gnome-shell --nested --wayland

clean:
	rm $(EXTENSION_ARCHIVE)

lint:
	npx eslint "**/*.js" --config .eslintrc.yml

lint-fix:
	npx eslint "**/*.js" --config .eslintrc.yml --fix
