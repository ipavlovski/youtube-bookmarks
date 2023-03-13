import { createStyles, Grid, Skeleton, Text } from '@mantine/core'
import { Channel, Chapter, Video } from '@prisma/client'
import { trpc, useAppStore } from 'components/app'


//  ==============================
//              STYLES
//  ==============================

const useStyles = createStyles(() => ({
  column: {

  },
  item: {

  }
}))


//  ================================
//              CHANNELS
//  ================================

const useFilteredChannels = () => {
  const { data: channels = [] } = trpc.getChannels.useQuery()

  return channels
}

function ChannelItem({ channel }: {channel: Channel}) {
  const { setSelection } = useAppStore((state) => state.actions)

  const clickHandler = () => {
    setSelection({ channel: channel.id, video: null, chapter: null })
  }

  return (
    <Text onClick={clickHandler} key={channel.id}>{channel.title}</Text>
  )
}

function ChannelColumn() {
  const channels = useFilteredChannels()
  const selectedChannel = useAppStore((state) => state.selection.channel)

  return (
    <>
      {channels.map((channel) => <ChannelItem key={channel.id} channel={channel}/>)}
    </>
  )
}

//  ==============================
//              VIDEOS
//  ==============================


const useFilteredVideos = () => {
  const selectedChannel = useAppStore((state) => state.selection.channel)
  const { data: videos = [] } = trpc.getVideos.useQuery(
    { channelId: selectedChannel! }, { enabled: selectedChannel != null }
  )

  return videos
}

function VideoItem({ video }: {video: Video}) {
  return (
    <Text key={video.id}>{video.title}</Text>
  )
}

function VideoColumn() {
  const videos = useFilteredVideos()
  const selectedVideo = useAppStore((state) => state.selection.video)

  return (
    <>
      {videos.map((video) => <VideoItem key={video.id} video={video}/>)}
    </>
  )
}

//  ================================
//              CHAPTERS
//  ================================


const useFilteredChapters = () => {
  const selectedVideo = useAppStore((state) => state.selection.video)
  const { data: chapters = [] } = trpc.getChapters.useQuery(
    { videoId: selectedVideo! }, { enabled: selectedVideo != null }
  )

  return chapters
}

function ChapterItem({ chapter }: {chapter: Chapter}) {
  return (
    <Text key={chapter.id}>{chapter.title}</Text>
  )
}

function ChapterColumn() {
  const chapters = useFilteredChapters()
  const selectedChapter = useAppStore((state) => state.selection.chapter)

  return (
    <>
      {chapters.map((chapter) => <ChapterItem key={chapter.id} chapter={chapter}/>)}
    </>
  )
}

//  ===============================
//              COLUMNS
//  ===============================


export default function MillerColumns() {
  return (
    <Grid>

      <Grid.Col span={3}>
        <ChannelColumn />
      </Grid.Col>

      <Grid.Col span={6}>
        <VideoColumn />
      </Grid.Col>

      <Grid.Col span={3}>
        <ChapterColumn />
      </Grid.Col>
    </Grid>
  )
}