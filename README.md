# Minimal 3D

Sometimes I need a minimal 3D graphics drawing/video production application. Just to illustrate an
idea or tell a quick story.  The idea here is that I've got the starting point for a 'real' project
that I'll eventually add to `proj` so that I can quickly get something together one-off.

## Development

This is just a bare repo with some HTML, CSS, and Javascript. Open up `js/main.js` and write something.

### Requirements

#### Configuration
The publish/deploy tools assume that you've setup a private container registry and podman server to
deploy to.  In order to keep the secrets out of files they should be stored in Keychain.

To setup the podman server:
`security add-generic-password -a "username" -s "https://podman.example.com" -w "your-password-here" -l "ENV: Podman server" -c "podman.example.com"`

To setup the private repository:
`security add-generic-password -a "username" -s "https://registry.example.com" -w "your-password-here" -l "ENV: Private container registry"`

Scripts will be able to pull the configuration they need from those keys. I use this setup for
everything so there's a good chance it's already done.

#### Software

* `Python3` to run the webserver natively.
* `Podman` to build images for production
* `gh` to handle github deployments
* `bun` to compile the javascript
* `make` to wrangle all the development tools

### Useful commands

Make is the front end for everything.

* `make help` display what you can do
* `make health` check the environment to see that it's setup correctly

#### Development

Normally you'd run `make dev` or `make server`: open a server at [http://localhost:8000/](http://localhost:8000/)
run the server via docker/nginx.

But if you really don't want to install Python3 then `make run` and `make stop` will run it via run
the server via Nginx in a container with Podman. **This will not update with changes in real time.**
These commands are intended for testing the container image rather than regular development.

#### Deployment

There are different stages to making a release that can be done indecently if you really want to.
Normally you'd run `make shipit v#.#.#` to do all of these at once.

##### Stages

There may be a time you want to slow-roll a release or perform the individual steps manually. Here
they are.

* `make release v#.#.#` makes a Github release. Makes a tag, pushes it all to github. Makes it easy
to have a partner verify changes before a broader release.

* `make publish` build a container with the current branch and push it to the private repository.
Supply a tag to push a release for that specific tag. A tag based on the current time is used.

* `make deploy [v#.#.#]` Take the most recent image (or the optionally supplied tag) and make that
live on the private podman server.

* `make deploy-github [v#.#.#]`. Deploy to github pages, either the current branch or an optionally
supplied tag. **Github pages are intended as an optional/secondary backup**. There is no rollback
here.

#### Disaster recovery

* `make rollback` Revert the podman version to the previous tag. If the most recent build sucks,
this gets something visible quickly while you clean up the mess.

* `make unrelease v#.#.#` Delete a release, something buggy, dangerous, etc.

* `make unpublish TAG`. Remove an image from the container repository. **TAG** can be found with
  Likely coupled with `make unrelease` or just to clean up stale used for testing.

#### Other/Misc commands

* `make build` compile the javascript, writes to `dist/`.
* `make clean` tidy up the build directory.
* `make image` build the container using Podman.
* `make published` list the containers tagged on the private repository
* `make clean-tags` tidy up old containers. You may need to run `registry garbage-collect` to clean
  up deleted container tags.

## Todo List

There are a bunch of things I use in almost everything I do:

* Environmental lighting
* Particle systems with some common effects
* Weather effects
* Common texture types

Etc.
