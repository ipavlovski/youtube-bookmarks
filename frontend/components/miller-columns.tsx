import { Avatar, createStyles, Flex, Grid, Text, Image } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { Channel, Chapter, Video } from '@prisma/client'
import { IconUser } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { getSelectionCache, SERVER_URL, trpc, useAppStore, useFilteredChannels, useFilteredChapters, useFilteredVideos } from 'components/app'
import { useYoutubeStore, YoutubeControls } from 'components/youtube-iframe'


const url = (src: string | null) => src && `${SERVER_URL}/images/${src}`


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


function ChannelItem({ channel }: {channel: Channel}) {
  const { classes: { active }, cx } = useStyles()
  const { setChannel } = useAppStore((state) => state.actions)
  const selectedChannel = useAppStore((state) => state.selection.channelId)

  const clickHandler = () => {
    setChannel(channel.id)
  }


  return (
    <Flex align={'center'} gap={12}>
      <Avatar src={url(channel?.icon)} radius="xl" m={4} >
        <IconUser size="1.5rem" />
      </Avatar>
      <Text className={cx(channel.id == selectedChannel && active)} onClick={clickHandler}>
        {channel.title}
      </Text>
    </Flex>

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


function VideoItem({ video }: {video: Video}) {
  const { classes: { active }, cx } = useStyles()
  const { setVideo } = useAppStore((state) => state.actions)
  const selectedVideo = useAppStore((state) => state.selection.videoId)
  const { setVideoId } = useYoutubeStore((state) => state.actions)

  const { cueVideo } = YoutubeControls()

  const titleClickHandler = () => {
    setVideo(video.id)
  }

  const thumbnailClickHandler = () => {
    cueVideo(video.videoId)
    setVideoId(video.videoId)
  }

  return (

    <Flex align={'center'} gap={12} m={8}>

      <Image
        height={120}
        width={200}
        radius='sm'
        src={url(video?.thumbnail)}
        withPlaceholder
        placeholder={<Text align="center">No thumbnail found yet.</Text>}
        onClick={thumbnailClickHandler}
        style={{ cursor: 'pointer' }}
      />


      <Text className={cx(video.id == selectedVideo && active)} onClick={titleClickHandler}>
        {video.title}
      </Text>
    </Flex>
  )
}

function VideoColumn() {
  const { classes: { column } } = useStyles()
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


function ChapterItem({ chapter: { id, timestamp, title, capture } }: {chapter: Chapter}) {

  const { classes: { active }, cx } = useStyles()
  const { setChapter } = useAppStore((state) => state.actions)
  const selectedChapter = useAppStore((state) => state.selection.chapterId)

  const { seekTo } = YoutubeControls()

  const titleClickHandler = () => {
    setChapter(id)
  }

  const thumbnailClickHandler = () => {
    seekTo(timestamp)
  }

  return (
    <Flex align={'center'} gap={12} m={8}>

      {capture.endsWith('.mp4') &&
      <Image
        height={120}
        width={200}
        radius='sm'
        src={`${SERVER_URL}/capture/${capture}`.replace('.mp4', '.gif')}
        withPlaceholder
        placeholder={<Text align="center">No thumbnail found yet.</Text>}
        onClick={thumbnailClickHandler}
        style={{ cursor: 'pointer' }}
      />}


      {capture.endsWith('.png') &&
      <Image
        height={120}
        width={200}
        radius='sm'
        src={`${SERVER_URL}/capture/${capture}`}
        withPlaceholder
        placeholder={<Text align="center">No thumbnail found yet.</Text>}
        onClick={thumbnailClickHandler}
        style={{ cursor: 'pointer' }}
      /> }

      <Text className={cx(id == selectedChapter && active)} onClick={titleClickHandler}>
        {title}
      </Text>
    </Flex>
  )
}

function ChapterColumn() {
  const { classes: { column } } = useStyles()
  const chapters = useFilteredChapters()

  return (
    <div className={column}>
      {chapters.map((chapter) => <ChapterItem key={chapter.id} chapter={chapter}/>)}
    </div>
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

          if (cachedVideo == null) {
            const videos = queryClient.getQueryData<Video[]>(
              [['getVideos'], { type: 'query', input: { channelId: channelId! } }]
            )
            if (videos && videos.length > 0) setVideo(videos[0].id)
          }
          if (cachedVideo != null) setVideo(cachedVideo.value)
        }

        if (activePane == 'video') {
          const cachedChapter = getSelectionCache( { type: 'video-chapter', key: videoId! })

          if (cachedChapter == null) {
            const chapters = queryClient.getQueryData<Chapter[]>(
              [['getChapters'], { type: 'query', input: { videoId: videoId! } }]
            )
            if (chapters && chapters.length > 0) setChapter(chapters[0].id)
          }
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
          const chapters = queryClient.getQueryData<Chapter[]>(
            [['getChapters'], { type: 'query', input: { videoId: videoId! } }]
          )
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
          const chapters = queryClient.getQueryData<Chapter[]>(
            [['getChapters'], { type: 'query', input: { videoId: videoId! } }]
          )
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