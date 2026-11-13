# Minimal 3D

Sometimes I need a minimal 3D graphics drawing/video production application. Just to illustrate an
idea or tell a quick story.  The idea here is that I've got the starting point for a 'real' project
that I'll eventually add to `proj` so that I can quickly get something together one-off.

## Development
This is just a bare repo with some HTML, CSS, and Javascript

## Plans/TODO

* Some post-processing bloom etc. Rethinking deferred, if my primary case is offline I can just let
  100 lights be slow.

* "Standard" camera controls. I know I want basically the same thing every time I do a 3D scene so
  it might as well just come out of the box. Most of this is a post-processing thing.

* "Standard" lighting. 9/10 times I know the basic lighting I want. Having a minimal setup just
  makes sense.

* An option to dump the scene to disk as a high quality video format - prores probably

* An option to dump the scene to disk as a highly compressed video format - h.256 probably

* An option to just dump a screenshot

* An option to control quality. 'realtime' vs 'offline'.

* An option to 'compile' everything into a nice small package, maybe with a built-in HTTP server or
  a docker container with nginx? Maybe it tries to 'minifi javascript'?  `make build`

* `make deploy` that can dump this on my terrible little podman server

* `make deploy github` than can dump the same scene on to a github page.

Once this is all in a reasonable state I'll add it to proj so a simple `proj new 3dscene foobar`
will game me up and running quickly.

I'm debating the right way to handle video. ffmpeg in a docker? should I bundle some kind of
headless chromium? maybe a simple tauri application? should the server be a 'docker/nginx' or maybe
i just have a couple lines of go/rust to be the server?
