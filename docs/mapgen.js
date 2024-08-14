// get hash for some image-data
async function digest (data, algo = 'SHA-1') {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest(algo, data)
    ),
    (byte) => byte.toString(16).padStart(2, '0')
  ).join('')
}

// turn a file object into an image
const fileToImage = file => new Promise((resolve, reject) => {
  const img = document.createElement('img')
  img.src = URL.createObjectURL(file)
  img.onload = () => {
    resolve(img)
  }
})

const TILE_WIDTH = 16
const TILE_HEIGHT = 16
const BG_COLOR = '#000000'

document.querySelector('input').addEventListener('change', async e => {
  // get all tiles pulledd out (as imagedata) by hash, in allTiles

  const allTiles = {}
  const maps = await Promise.all([...e.target.files].map(async file => {
    const image = await fileToImage(file)
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.fillStyle = BG_COLOR
    ctx.fillRect(0, 0, image.naturalWidth, image.naturalHeight)
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight)
    const tiles = []
    const size = [(image.naturalWidth / TILE_WIDTH), (image.naturalHeight / TILE_HEIGHT)]
    for (let y = 0; y < size[1]; y++) {
      for (let x = 0; x < size[0]; x++) {
        const imagedata = ctx.getImageData(x * TILE_WIDTH, y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT)
        const hash = await digest(new Uint8Array(imagedata.data.buffer))
        allTiles[hash] = imagedata
        tiles.push(hash)
      }
    }
    return {
      filename: file.name,
      tiles,
      size
    }
  }))

  // create shared spritesheet image & tiled
  const tileIds = Object.keys(allTiles)
  const columns = Math.ceil(Math.sqrt(tileIds.length))
  const canvas = document.createElement('canvas')
  canvas.width = columns * TILE_WIDTH
  canvas.height = columns * TILE_HEIGHT
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  const tileset = {
    columns,
    image: 'tiles.png',
    imageheight: canvas.height,
    imagewidth: canvas.width,
    margin: 0,
    name: 'tiles',
    spacing: 0,
    tilecount: tileIds.length,
    tiledversion: '1.11.0',
    tileheight: TILE_HEIGHT,
    tilewidth: TILE_WIDTH,
    type: 'tileset',
    version: '1.10'
  }

  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, columns * TILE_WIDTH, columns * TILE_HEIGHT)
  let i = 0
  for (let y = 0; y < columns; y++) {
    for (let x = 0; x < columns; x++) {
      if (tileIds[i]) {
        ctx.putImageData(allTiles[tileIds[i]], x * TILE_WIDTH, y * TILE_HEIGHT)
      }
      i++
    }
  }
  canvas.toBlob(async blob => {
    const sheetUrl = URL.createObjectURL(blob)
    function download (urls) {
      const [url, filename] = urls.pop()
      const a = document.createElement('a')
      a.setAttribute('href', url)
      a.setAttribute('download', filename)
      a.click()
      if (urls.length === 0) {
        clearInterval(interval)
      }
    }

    const downloads = [
      [sheetUrl, 'tiles.png'],
      ['data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tileset, null, 2)), 'tiles.tsj']
    ]

    for (const map of maps) {
      const name = map.filename.split('.')[0]
      const tilemap = {
        compressionlevel: -1,
        width: map.size[0],
        height: map.size[1],
        infinite: false,
        layers: [
          {
            data: map.tiles.map(hash => tileIds.indexOf(hash) + 1),
            width: map.size[0],
            height: map.size[1],
            name,
            id: 1,
            opacity: 1,
            type: 'tilelayer',
            visible: true,
            x: 0,
            y: 0
          }],
        nextlayerid: 3,
        nextobjectid: 1,
        orientation: 'orthogonal',
        renderorder: 'right-down',
        tiledversion: '1.11.0',
        tilewidth: TILE_WIDTH,
        tileheight: TILE_HEIGHT,
        tilesets: [
          {
            firstgid: 1,
            source: 'tiles.tsj'
          }],
        type: 'map',
        version: '1.10'
      }
      downloads.push(['data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tilemap, null, 2)), `${name}.tmj`])
    }

    const interval = setInterval(download, 300, downloads)
  })
})
