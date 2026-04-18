const multer  = require('multer')
const path    = require('path')
const crypto  = require('crypto')

const ALLOWED_EXT = new Set([
  '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
  '.js', '.ts', '.jsx', '.tsx', '.py', '.html', '.css', '.json', '.zip',
])

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (_req, file, cb) => {
    const ext    = path.extname(file.originalname).toLowerCase()
    const unique = crypto.randomBytes(8).toString('hex')
    cb(null, `${Date.now()}-${unique}${ext}`)
  },
})

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase()
  ALLOWED_EXT.has(ext)
    ? cb(null, true)
    : cb(new Error(`Tipo de archivo no permitido: ${ext}`))
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
})

function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase()
  if (ext === '.pdf')                                         return 'pdf'
  if (['.jpg','.jpeg','.png','.gif','.svg','.webp'].includes(ext)) return 'image'
  if (['.js','.ts','.jsx','.tsx','.py','.html','.css','.json'].includes(ext)) return 'code'
  return 'other'
}

module.exports = { upload, getFileType }
