async function digest (data, algo = 'SHA-1') {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest(algo, data)
    ),
    (byte) => byte.toString(16).padStart(2, '0')
  ).join('')
}

// get all tiles in an image
export async function getMap (image, ctx, tileWidth = 16, tileHeight = 16) {
  const map = {
    image,
    tileWidth,
    tileHeight,
    width: Math.floor(image.width / tileWidth),
    height: Math.floor(image.height / tileHeight),
    tiles: [],
    tileIds: {}
  }
  ctx.drawImage(image, 0, 0, image.width, image.height)
  for (let x = 0; x < map.width; x++) {
    for (let y = 0; y < map.height; y++) {
      const data = ctx.getImageData(x * tileWidth, y * tileHeight, tileWidth, tileHeight)
      const hash = await digest(new Uint8Array(data.data.buffer))
      map.tileIds[hash] = data
      map.tiles.push(hash)
    }
  }
  return map
}

// use hashes in tileIds to share tiles across multiple image-maps
export function mergeMaps (maps) {
  let tileIds = {}
  const out = {}
  for (const id of Object.keys(maps)) {
    tileIds = { ...tileIds, ...maps[id].tileIds }
  }
  const tiles = Object.keys(tileIds)
  // convert to index-keys instead of hashes
  for (const id of Object.keys(maps)) {
    out[id] = maps[id].tiles.map(h => tiles.indexOf(h))
  }
  return { maps: out, tiles: Object.values(tileIds) }
}
