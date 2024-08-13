#!/usr/bin/env node

import { writeFile } from 'node:fs/promises'
import { createCanvas, loadImage } from 'canvas'
import { getMap, mergeMaps } from './lib.js'

import { basename } from 'node:path'

if (process.argv.length < 4) {
  console.error('Usage: mapgen <OUT_DIR> <...FILES>')
  process.exit(1)
}

// TODO: this could be CLI options
const tileWidth = 16
const tileHeight = 16

const [,, outDir, ...files] = process.argv

// given an array of tiles, create a spritesheet image
async function generateSpritesheetImage (filename, tiles, tileWidth = 16, tileHeight = 16) {
  const canvasWidth = tiles.length
  const canvasHeight = canvasWidth
  const canvas = createCanvas(canvasWidth, canvasHeight)
  const ctx = canvas.getContext('2d')

  for (let x = 0; x < canvasWidth; x += tileWidth) {
    for (let y = 0; y < canvasHeight; y += tileHeight) {
      if (tiles.length) {
        ctx.putImageData(tiles.shift(), x, y)
      }
    }
  }
  const buf = canvas.toBuffer('image/png')
  await writeFile(filename, buf)
}

const maps = {}

for (const file of files) {
  const id = basename(file, '.png')
  const image = await loadImage(file)
  const canvas = createCanvas(image.width, image.height)
  const ctx = canvas.getContext('2d')
  maps[id] = await getMap(image, ctx, tileWidth, tileHeight)
}

const merged = mergeMaps(maps)

// use merged.tiles to create spritesheet image
await generateSpritesheetImage(`${outDir}/tiles.png`, merged.tiles)

// create tiled tileset file
const columns = Math.ceil(merged.tiles.length / 2)
const spritesheetImage = await loadImage(`${outDir}/tiles.png`)
const tileset = {
  columns,
  image: 'tiles.png',
  imageheight: spritesheetImage.height,
  imagewidth: spritesheetImage.width,
  margin: 0,
  name: 'tiles',
  spacing: 0,
  tilecount: columns * 2,
  tiledversion: '1.11.0',
  tileheight: tileHeight,
  tilewidth: tileWidth,
  type: 'tileset',
  version: '1.10'
}
await writeFile(`${outDir}/tiles.json`, JSON.stringify(tileset, null, 2))

// TODO: generate seperate tiled maps from merged.maps
