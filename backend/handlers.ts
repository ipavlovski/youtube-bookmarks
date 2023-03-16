import { PrismaClient } from '@prisma/client'
import { STORAGE_DIRECTORY } from 'backend/config'
import { exec } from 'node:child_process'
import { rename, rm, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'

const execute = promisify(exec)
const prisma = new PrismaClient()

export async function getChannels() {
  return await prisma.channel.findMany({ take: 100 })
}

export async function getVideos({ channelId }: { channelId: number}) {
  return await prisma.video.findMany({ where: { channelId }, take: 100 })
}

export async function getChapters({ videoId }: { videoId: number}) {
  return await prisma.chapter.findMany({ where: { videoId }, take: 100 })
}

export async function getVideoForPlayback(videoId: string) {
  return await prisma.video.findFirstOrThrow({
    where: { videoId },
    include: {
      channel: true,
      chapters: true
    }
  })
}


// async function saveCapturedMedia(base64: string, videoId: string) {
//   const ext
//   const filename = `${Date.now()}-${videoId}.${ext}`
//   const buffer = Buffer.from(base64, 'base64')
//   await writeFile(filename, buffer)
//   return filename
// }


async function saveCapturedMedia(base64: string, videoId: string) {
  const basename = `${Date.now()}-${videoId}`
  let filename: string | null = null
  const dir = `${STORAGE_DIRECTORY}/capture`

  try {
    const buffer = Buffer.from(base64, 'base64')
    await writeFile(`${dir}/${basename}.unknown`, buffer)

    const { stdout } = await execute(`file -Lib ${dir}/${basename}.unknown`)
    const [mime] = stdout.split(';', 1)

    switch (mime) {
      case 'image/png':
        filename = `${basename}.png`
        break
      case 'video/mp4':
        filename = `${basename}.mp4`
        break
      default:
        console.log('No handler available')
        break
    }
    if (! filename) throw new Error('Failed to get matchign mimes.')
    rename(`${dir}/${basename}.unknown`, `${dir}/${filename}`)

  } catch {
    console.log('Error during file-type identification')
    await rm(`${dir}/${basename}.unknown`, { force: true })
  }

  return filename

}


export async function createChapter({ videoId, timestamp, title, base64 }:
{ videoId: string; timestamp: number; title: string; base64: string }) {

  const capture = await saveCapturedMedia(base64, videoId)
  if (capture == null) throw new Error('Error during file-type identification')

  return await prisma.chapter.create({ data: {
    capture,
    timestamp,
    title,
    video: { connect: { videoId } },
  } })
}
