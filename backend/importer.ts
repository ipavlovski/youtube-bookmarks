import { PrismaClient } from '@prisma/client'
import { readFile, readdir } from 'fs/promises'
import { uniqBy } from 'lodash'
import { DateTime } from 'luxon'
import { randomUUID as uuidv4 } from 'node:crypto'
import { writeFile } from 'node:fs/promises'


const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const prisma = new PrismaClient()

type BookmarkRecord = { videoId: string, isoDate: string }
async function readPlaylistFile(path: string) {
  const file = await readFile(path, 'utf-8')
  const splitLines = file.trim().split('\n')

  return splitLines.slice(4).map((v) => {
    const [videoId, rawDate] = v.split(',')

    return {
      videoId: videoId.trim(),
      isoDate: DateTime.fromJSDate(new Date(rawDate)).setZone('America/Halifax').toISO()
    } as BookmarkRecord
  })
}

type YoutubeVideo = {
  title: string, description: string, uploadedAt: Date, videoId: string,
  channelId: string, thumbnail: string | null
}
async function queryVideo(videoId: string) {
  const params = `part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
  const url = `https://youtube.googleapis.com/youtube/v3/videos?${params}`

  const results = await fetch(url).then((res) => res.json())
  if (results.items.length == 0) return null

  const video = results.items[0].snippet
  return {
    title: video.title,
    description: video.description,
    uploadedAt: new Date(video.publishedAt),
    videoId: videoId,
    channelId: video.channelId,
    thumbnail: video?.thumbnails?.maxres?.url ??
      video?.thumbnails?.standard?.url ??
      video.thumbnails?.default?.url
  } as YoutubeVideo
}

type YoutubeChannel = {
  title: string, description: string, createdAt: Date, channelId: string, icon: string | null
}
async function queryChannel(channelId: string) {
  const params = `part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`
  const url = `https://youtube.googleapis.com/youtube/v3/channels?${params}`

  const results = await fetch(url).then((res) => res.json())
  if (results.items.length == 0) return null

  const channel = results.items[0].snippet
  return {
    channelId: channelId,
    title: channel.title,
    description: channel.description,
    createdAt: new Date(channel.publishedAt),
    icon: channel.thumbnails?.high?.url ?? channel.thumbnails?.default?.url
  } as YoutubeChannel
}

async function getFullPaths(dir: string) {
  const files = await readdir(dir)
  return files.map((path) => `${dir}/${path}`)
}

async function downloadImage(url: string) {
  try {
    const imageData = await fetch(url).then((v) => v.arrayBuffer())
    const filename = uuidv4()
    await writeFile(`assets/images/${filename}`, Buffer.from(imageData))
    return filename
  } catch {
    return null
  }
}


async function createChannel({ channelId, createdAt,description, icon, title }: YoutubeChannel) {
  const channelIcon = icon && await downloadImage(icon)

  try {
    const channel = await prisma.channel.create({ data: {
      channelId, title, description, createdAt,
      icon: channelIcon != null ? channelIcon : undefined
    } })
    return channel
  } catch (err) {
    console.error(err instanceof Error ? err.message : `Error creating channel: ${channelId}`)
    return null
  }
}

async function createVideo(props: YoutubeVideo, channelId: number) {
  const { description, thumbnail, title, uploadedAt, videoId } = props

  const videoThumbnail = thumbnail && await downloadImage(thumbnail)
  try {
    const video = await prisma.video.create({ data: {
      title, description, uploadedAt, videoId,
      channel: { connect: { id: channelId } },
      thumbnail: videoThumbnail != null ? videoThumbnail : undefined,
    } })
    return video
  } catch (err) {
    console.error(err instanceof Error ? err.message : `Error creating video: ${videoId}`)
    return null
  }
}

async function createHistory(videoId: number, visitedAt: string, bookmark: boolean) {
  return await prisma.history.create({ data: {
    visitedAt, video: { connect: { id: videoId } }, bookmarked: true
  } })
}


async function addRecord({ videoId, isoDate }: BookmarkRecord) {
  // check if video exists in DB
  let video = await prisma.video.findFirst({ where: { videoId } })
  if (! video) {
    // check if video return API results
    const youtubeVideo = await queryVideo(videoId)
    if (youtubeVideo == null) return null

    // check if channel already exists
    let channel = await prisma.channel.findFirst({ where: { channelId: youtubeVideo.channelId } })
    if (! channel) {
      // check if channel  returns API results
      const youtubeChannel = await queryChannel(youtubeVideo.channelId)
      if (! youtubeChannel) return null
      channel = await createChannel(youtubeChannel)
      if (! channel) return null
    }
    video = await createVideo(youtubeVideo, channel.id)
    if (! video) return null
  }
  return await createHistory(video.id, isoDate, true)
}


const files = [
  await getFullPaths('assets/data/2022-10-12/playlists'),
  await getFullPaths('assets/data/2023-03-11/playlists')
]

const acc: {videoId: string, isoDate: string}[][] = []
for (const path of files.flat()) {
  const results = await readPlaylistFile(path)
  acc.push(results.filter((v) => v.isoDate != null))
}
const records = uniqBy(acc.flat(), 'videoId')

// call more APIs after from here
// 6215/7926, record: 6117
for (let ind = 6221; ind < records.length -4 ; ind++) {
  const result = await addRecord(records[ind])
  console.log(`${ind}/${records.length - 4}, record: ${result?.videoId}`)
}
