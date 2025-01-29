![Blocker banner](./assets/banner-jsdoc.png)

## Getting started

### Installation

First, you need to install [hBlock](https://hblock.molinero.dev/). Follow the instructions [here](https://github.com/pesader/gnome-shell-extension-blocker/wiki/Installing-hBlock) to install it.

<div style="border-left: 4px solid #8250df; padding: 10px; border-radius: 5px;">
  <div style="color: #8250df; font-weight: bold; margin-bottom: 5px;">&#128712; Important</div>
  <div>Blocker depends on <a href="https://github.com/hectorm/hblock/" target="_blank">hBlock</a> and won't work if you haven't installed it on your computer.</div>
</div>

After installing hBlock, you can install Blocker itself through the GNOME Extensions website.

<img height="80" src="assets/ego.png">

### Usage

<br>
<div style="border-left: 4px solid #d32f2f; padding: 10px; border-radius: 5px;">
  <div style="color: #d32f2f; font-weight: bold; margin-bottom: 5px;">&#9888; Caution</div>
  <div>Blocker replaces your system's <code>/etc/hosts</code> file. Consider making a backup of it!</div>
</div>

Click the Quick Settings toggle and input your user's password to activate Blocker (it will take a while to download all its denylists). Once Blocker is active, it will display a system indicator of a shield. To turn it off, simply click the toggle and input your password again.

## FAQ

### How does it work?

This GNOME Shell extension is just a convenient frontend for [hBlock](https://github.com/hectorm/hblock/), which does all the heavy lifting. Here's what happens when you toggle Blocker:

First, Blocker uses pkexec (the program that prompts you for your password) to gain super user privilege, which is required to run hBlock. Then, if you enabled Blocker, it enables hBlock by running `hblock`. If you disabled Blocker, it disables hBlock by running `hblock -S none -D none`. I couldn't resist a flowchart...

<img src="assets/flowchart.png">

### What are its limitations?

Blocker is powered by hBlock, so its limitations are Blocker's limitations.

The content blocking strategy used by hBlock is [DNS blocking](https://en.wikipedia.org/wiki/DNS_blocking). That means that any connections that do not depend on name resolution cannot be blocked using this approach, such as accessing an IP address directly. Additionally, certain applications may set their own DNS settings (e.g. Firefox, when it uses DNS over HTTPS) instead of adhering to the system's configuration. Finally, your DNS settings may be affected if you are using a VPN, which tipically route your DNS queries to its own resolvers.

### How do I know it's working?

Visit https://hblock.molinero.dev, it tells you whether hBlock is active or not. This is does that by checking if connections to https://hblock-check.molinero.dev are blocked, which is the case for hBlock's default configuration.

### Can I customize the denylist?

Blocker does not provide, not plans to provide, that kind of customization. However, you can do that if you hBlock directly in the terminal, using `-A`, `-D`, and `-S` flags. Run `hblock --help` for more details.

### Where should I report problems?

For false positives, report in [hBlock's issue tracker](https://github.com/hectorm/hblock/issues). For everything else, report in [Blocker's issue tracker](https://github.com/pesader/gnome-shell-extension-blocker/issues).

## Contributing

### Understanding the codebase

Blocker's code is documented using JSDoc. You can read the documentation directly in the source code, or head to the [Developer Documentation](https://pesader.dev/gnome-shell-extension-blocker/) page.

### Building and installing from source

If you wish to make changes to the Blocker codebase, you will likely want to build it and install it from source. Blocker's source code on hosted on [GitHub](https://github.com/pesader/gnome-shell-extension-blocker). Your first step is cloning Blocker's repository with:

```bash
git clone https://github.com/pesader/gnome-shell-extension-blocker.git
```

You can then build and install the extension with:

```bash
cd gnome-shell-extension-blocker
make build && make install
```

You can run a nested session of GNOME Shell to test the extension out with:

```bash
make run
```

Before submitting a pull request, make sure you install and run the linter with:

```bash
make lint-install # install the linter
make lint         # run the linter
```

You can also have the linter attempt to fix the errors it found with:

```bash
make lint-fix
```

## Attribution

### Code

- Assign a custom icon to a Quick Settings toggle: based on the codebase from [Caffeine](https://github.com/eonpatapon/gnome-shell-extension-caffeine).
- Run shell commands asynchronously: heavily inspired by the [GJS docs](https://gjs.guide/guides/gio/subprocesses.html) and [GSConnect](https://github.com/GSConnect/gnome-shell-extension-gsconnect/blob/main/src/service/plugins/runcommand.js).
- Send customized notifications: reused from [Gravatar](https://github.com/dsheeler/gnome-shell-extensions-gravatar) and [Picture of the day](https://github.com/swsnr/gnome-shell-extension-picture-of-the-day) extensions.

### Assets

- Blocker's logo: derived from the [`shield-safe-symbolic`](https://gitlab.gnome.org/World/design/icon-library/-/blob/master/data/resources/icon-dev-kit/shield-safe-symbolic.svg?ref_type=heads) icon, by the GNOME Project.
- Blocker's banner: inspired by the banners at [Flathub's home page](https://flathub.org/)
- EGO banner: modified from [Just Perfection's work](https://gitlab.gnome.org/jrahmatzadeh/just-perfection/-/blob/main/data/imgs/ego.svg?ref_type=heads).

### Build system

- Makefile: inspired by the Makefile of [Caffeine](https://github.com/eonpatapon/gnome-shell-extension-caffeine/blob/master/Makefile)
- GitHub Actions workflow file: again, inspired [Caffeine](https://github.com/eonpatapon/gnome-shell-extension-caffeine/tree/master/.github/workflows)

### Documentation

- How to install hBlock: copied and pasted staright from hBlock's [README](https://github.com/hectorm/hblock/?tab=readme-ov-file#installation) and [docs](https://github.com/hectorm/hblock/blob/master/PACKAGES.md)

## Gratitude

This project would not exist if it weren't for hBlock, so I thank its maintainer and all its contributors. I'm also grateful to everyone in the GNOME Extensions matrix room, who kindly answered the many questions that came up while I was writing this program.

## License

This project is licensed under the terms of the [GPLv3](https://www.gnu.org/licenses/gpl-3.0.txt).
