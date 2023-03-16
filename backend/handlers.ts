import { PrismaClient, Prisma, } from '@prisma/client'
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
