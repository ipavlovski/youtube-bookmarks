import { PrismaClient, Prisma, } from '@prisma/client'
const prisma = new PrismaClient()


export async function getFilteredChannels({ title }: { title?: string}) {
  return await prisma.channel.findMany({ where: { title: { contains: title } } })
}

export async function getFilteredVideos({ title, channelId }: { title?: string, channelId?: number}) {
  return await prisma.video.findMany({ where: { channelId, title: { contains: title } } })
}

export async function getFilteredChapters({ title, videoId }: { title?: string, videoId?: number}) {
  return await prisma.chapter.findMany({ where: { videoId, title: { contains: title } } })
}
