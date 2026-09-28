// Compresión en el celular antes de subir: lado mayor 1600 px, WebP ~80 %.
// En producción la foto se sube en segundo plano a almacenamiento de objetos.

export interface CompressedPhoto {
  url: string
  originalKb: number
  compressedKb: number
  width: number
  height: number
}

export async function compressPhoto(file: File, maxSide = 1600, quality = 0.8): Promise<CompressedPhoto> {
  const src = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = src
    })
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.round(img.naturalWidth * scale)
    const h = Math.round(img.naturalHeight * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d')?.drawImage(img, 0, 0, w, h)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
    const out = blob ?? file
    return {
      url: URL.createObjectURL(out),
      originalKb: Math.round(file.size / 1024),
      compressedKb: Math.round(out.size / 1024),
      width: w,
      height: h,
    }
  } finally {
    URL.revokeObjectURL(src)
  }
}
