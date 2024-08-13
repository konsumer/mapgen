This will create a [tiled](https://www.mapeditor.org/) map from some images.

The idea is that you can take a series of maps from gameplay and output tiled maps + spritesheet for all of them. You can extract map images from gameplay video, with a tool like [animmerger](https://bisqwit.iki.fi/source/animmerger.html)


## setup

```
# download and setup
git clone https://github.com/konsumer/mapgen.git
cd mapgen

# you might need these deps:

# ubuntu, deb, etc
# sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# fedora, etc
# sudo yum install gcc-c++ cairo-devel pango-devel libjpeg-turbo-devel giflib-devel

# mac
# brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman python-setuptools

npm i
```

## usage

I did some examples using [these maps](https://nesmaps.com/maps/SuperMarioBrothers/SuperMarioBrothers.html). I edited them to just not include anything that is not in game (map instructions, etc):

```
# run like this
./mapgen.mjs examples/ gen maps/*.png
```
