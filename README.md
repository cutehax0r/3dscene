# Minimal 3D

Sometimes I need a minimal 3D graphics drawing/video production application. Just to illustrate an
idea or tell a quick story.  The idea here is that I've got the starting point for a 'real' project
that I'll eventually add to `proj` so that I can quickly get something together one-off.

## Development
This is just a bare repo with some HTML, CSS, and Javascript

## Plans/TODO

* Deferred rendering. While it's more involved than forward rendering it brings freedom for lighting
  and there are post-processing effects I want anyway

* "Standard" camera controls. I know I want basically the same thing every time I do a 3D scene so
  it might as well just come out of the box.

* "Standard" lighting. 9/10 times I know the basic lighting I want. Having a minimal setup just
  makes sense.

* An option to dump the scene to disk as a high quality video format - prores probably

* An option to dump the scene to disk as a highly compressed video format - h.256 probably

* An opiton to just dump a screenshot

* `make deploy` that can dump this on my terrible little podman server

* `make deploy github` than can dump the same scene on to a github page.

Once this is all in a reasonable state I'll add it to proj so a simple `proj new 3dscene foobar`
will game me up and running quickly.
