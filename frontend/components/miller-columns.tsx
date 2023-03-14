import { createStyles, Grid, Text } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { Channel, Chapter, Video } from '@prisma/client'
import { useQueryClient } from '@tanstack/react-query'
import { getSelectionCache, trpc, useAppStore } from 'components/app'


//  ==============================
//              STYLES
//  ==============================

const useStyles = createStyles(() => ({
  column: {
    overflowY: 'scroll',
    height: 900,
    '&::-webkit-scrollbar': {
      display: 'none'
    },
  },
  item: {

  },
  active: {
    color: 'green'
  }
}))


//  ================================
//              CHANNELS
//  ================================

const useFilteredChannels = () => {
  // const { data: channels = [] } = trpc.getChannels.
  // useQuery(undefined, { queryKey: ['getChannels', 'channels'] })
  const { data: channels = [] } = trpc.getChannels.useQuery()

  return channels
}

function ChannelItem({ channel }: {channel: Channel}) {
  const { classes: { active }, cx } = useStyles()
  const { setChannel } = useAppStore((state) => state.actions)
  const selectedChannel = useAppStore((state) => state.selection.channelId)

  const clickHandler = () => {
    setChannel(channel.id)
  }

  return (
    <Text className={cx(channel.id == selectedChannel && active)} onClick={clickHandler}>
      {channel.title}
    </Text>
  )
}

function ChannelColumn() {
  const { classes: { column }, cx } = useStyles()
  const channels = useFilteredChannels()


  return (
    <div className={column}>
      {channels.map((channel) => <ChannelItem key={channel.id} channel={channel}/>)}
    </div>
  )
}

//  ==============================
//              VIDEOS
//  ==============================


const useFilteredVideos = () => {
  const selectedChannel = useAppStore((state) => state.selection.channelId)
  const { data: videos = [] } = trpc.getVideos.useQuery(
    { channelId: selectedChannel! }, { enabled: selectedChannel != null }
  )

  return videos
}

function VideoItem({ video }: {video: Video}) {
  const { classes: { active }, cx } = useStyles()
  const { setVideo } = useAppStore((state) => state.actions)
  const selectedVideo = useAppStore((state) => state.selection.videoId)

  const clickHandler = () => {
    setVideo(video.id)
  }

  return (
    <Text className={cx(video.id == selectedVideo && active)} onClick={clickHandler}>
      {video.title}
    </Text>
  )
}

function VideoColumn() {
  const { classes: { column }, cx } = useStyles()
  const videos = useFilteredVideos()

  return (
    <div className={column}>
      {videos.map((video) => <VideoItem key={video.id} video={video}/>)}
    </div>
  )
}

//  ================================
//              CHAPTERS
//  ================================


const useFilteredChapters = () => {
  const selectedVideo = useAppStore((state) => state.selection.videoId)
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
  const selectedChapter = useAppStore((state) => state.selection.chapterId)

  return (
    <>
      {chapters.map((chapter) => <ChapterItem key={chapter.id} chapter={chapter}/>)}
    </>
  )
}

//  ===============================
//              COLUMNS
//  ===============================


const useArrowShortcuts = () => {
  const { channelId, videoId, chapterId } = useAppStore((state) => state.selection)
  const { setChannel, setVideo, setChapter } = useAppStore((state) => state.actions)
  const queryClient = useQueryClient()

  const activePane: 'channel' | 'video' | 'chapter' =
    channelId && videoId && chapterId ? 'chapter' : channelId && videoId ? 'video' : 'channel'

  useHotkeys([
    [
      'ArrowLeft', () => {
        if (activePane == 'chapter') videoId != null && setVideo(videoId)
        if (activePane == 'video') channelId != null && setChannel(channelId)
      },
    ],
    [
      'ArrowRight',() => {
        if (activePane == 'channel') {
          const cachedVideo = getSelectionCache( { type: 'channel-video', key: channelId! })
          console.log(`channel->vid right, cached: ${cachedVideo}`)
          if (cachedVideo == null) {
            const videos = queryClient.getQueryData<Video[]>(
              [['getVideos'], { type: 'query', input: { channelId: channelId! } }]
            )
            if (videos && videos.length > 0) setVideo(videos[0].id)
          }
          if (cachedVideo != null) setVideo(cachedVideo.value)
        }
        if (activePane == 'video') {
          console.log('video->chapter right')
          const cachedChapter = getSelectionCache( { type: 'video-chapter', key: videoId! })
          if (cachedChapter != null) setChapter(cachedChapter.value)
        }
      },
    ],
    [
      'ArrowUp',() => {
        if (activePane == 'channel') {
          const channels = queryClient.getQueryData<Channel[]>([['getChannels'], { type: 'query' }])
          const ind = channels?.findIndex((channel) => channel.id == channelId)
          if (ind != null && ind == 0) return
          if (channels != null && ind != null && ind != -1) setChannel(channels[ind-1].id)
        }
        if (activePane == 'video') {
          const videos = queryClient.getQueryData<Video[]>(
            [['getVideos'], { type: 'query', input: { channelId: channelId! } }]
          )
          const ind = videos?.findIndex((video) => video.id == videoId)
          if (ind != null && ind == 0) return
          if (videos != null && ind != null && ind != -1) setVideo(videos[ind-1].id)
        }
        if (activePane == 'chapter') {
          const chapters = queryClient.getQueryData<Chapter[]>(['chapters'])
          const ind = chapters?.findIndex((chapter) => chapter.id == chapterId)
          if (ind != null && ind == 0) return
          if (chapters != null && ind != null && ind != -1) setChapter(chapters[ind-1].id)
        }
      },
    ],
    [
      'ArrowDown',() => {
        if (activePane == 'channel') {
          const channels = queryClient.getQueryData<Channel[]>([['getChannels'], { type: 'query' }])
          const ind = channels?.findIndex((channel) => channel.id == channelId)
          if (ind != null && ind != -1 && ind + 1 == channels?.length) return
          if (channels != null && ind != null && ind != -1) setChannel(channels[ind+1].id)
        }
        if (activePane == 'video') {
          const videos = queryClient.getQueryData<Video[]>(
            [['getVideos'], { type: 'query', input: { channelId: channelId! } }]
          )
          const ind = videos?.findIndex((video) => video.id == videoId)
          if (ind != null && ind != -1 && ind + 1 == videos?.length) return
          if (videos != null && ind != null && ind != -1) setVideo(videos[ind+1].id)
        }
        if (activePane == 'chapter') {
          const chapters = queryClient.getQueryData<Chapter[]>(['chapters'])
          const ind = chapters?.findIndex((chapter) => chapter.id == chapterId)
          if (ind != null && ind == 0 && ind + 1 == chapters?.length) return
          if (chapters != null && ind != null && ind != -1) setChapter(chapters[ind+1].id)
        }
      },
    ],
  ])
}


export default function MillerColumns() {
  useArrowShortcuts()

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