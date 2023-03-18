import { Avatar, createStyles, Flex, Grid, Group, Image, Stack, Text } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { Channel, Chapter, Video } from '@prisma/client'
import { IconUser } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { getCaptureUrl, getImageUrl, getSelectionCache, SERVER_URL, useAppStore, useFilteredChannels, useFilteredChapters, useFilteredVideos } from 'components/app'
import { useYoutubeStore, YoutubeControls } from 'components/youtube-iframe'


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


//  =============================
//              ITEMS
//  =============================


function ChannelItem({ channel }: {channel: Channel}) {
  const { classes: { active }, cx } = useStyles()
  const { setChannel } = useAppStore((state) => state.actions)
  const selectedChannel = useAppStore((state) => state.selection.channelId)

  const clickHandler = () => {
    setChannel(channel.id)
  }


  return (
    <Flex align={'center'} gap={12}>
      <Avatar src={getImageUrl(channel?.icon)} radius="xl" m={4} >
        <IconUser size="1.5rem" />
      </Avatar>
      <Text className={cx(channel.id == selectedChannel && active)} onClick={clickHandler}>
        {channel.title}
      </Text>
    </Flex>

  )
}


function VideoItem({ video }: {video: Video}) {
  const { classes: { active }, cx } = useStyles()
  const { setVideo } = useAppStore((state) => state.actions)
  const selectedVideo = useAppStore((state) => state.selection.videoId)
  const { setVideoId } = useYoutubeStore((state) => state.actions)

  const { cueVideo } = YoutubeControls

  const titleClickHandler = () => {
    setVideo(video.id)
  }

  const thumbnailClickHandler = () => {
    cueVideo(video.videoId)
    setVideoId(video.videoId)
  }

  return (

    <Group align={'center'} mt={16} spacing={2}>

      <Text truncate
        className={cx(video.id == selectedVideo && active)}
        onClick={titleClickHandler}>
        {video.title}
      </Text>

      <Image
        // height={120}
        // width={200}
        radius='sm'
        src={getImageUrl(video?.thumbnail)}
        withPlaceholder
        placeholder={<Text align="center">No thumbnail found yet.</Text>}
        onClick={thumbnailClickHandler}
        style={{ cursor: 'pointer' }}
      />

    </Group>
  )
}


function ChapterItem({ chapter: { id, timestamp, title, capture } }: {chapter: Chapter}) {

  const { classes: { active }, cx } = useStyles()
  const { setChapter } = useAppStore((state) => state.actions)
  const selectedChapter = useAppStore((state) => state.selection.chapterId)

  const { seekTo } = YoutubeControls

  const titleClickHandler = () => {
    setChapter(id)
  }

  const thumbnailClickHandler = () => {
    seekTo(timestamp)
  }

  return (
    <Group align={'center'} mt={10} spacing={2}>

      <Text truncate size={'sm'}
        className={cx(id == selectedChapter && active)}
        onClick={titleClickHandler}>
        {title}
      </Text>

      <Image
        // height={120}
        // width={200}
        height={150}
        radius='sm'
        src={getCaptureUrl(capture)}
        withPlaceholder
        placeholder={<Text align="center">No thumbnail found yet.</Text>}
        onClick={thumbnailClickHandler}
        style={{ cursor: 'pointer' }}
      />


    </Group>
  )
}


//  ==================================
//              NAVIGATION
//  ==================================


const useQueryCache = () => {
  const queryClient = useQueryClient()

  const getChannels = () => {
    return queryClient.getQueryData<Channel[]>([['getChannels'], { type: 'query' }])
  }

  const getVideos = (channelId: number) => {
    return queryClient.getQueryData<Video[]>(
      [['getVideos'], { type: 'query', input: { channelId } }]
    )
  }

  const getChapters = (videoId: number) => {
    return queryClient.getQueryData<Chapter[]>(
      [['getChapters'], { type: 'query', input: { videoId } }]
    )
  }

  return { getChannels, getVideos, getChapters }
}

const getPrevIndex = <T,>(arr: Array<T & { id: number }> | undefined, id: number | null) => {
  if (id == null || arr == null) return null
  const ind = arr.findIndex((elt) => elt.id == id)
  return ind != null && ind > 0 ? ind - 1 : null
}

const getNextIndex = <T,>(arr: Array<T & { id: number }> | undefined, id: number | null) => {
  if (id == null || arr == null) return null
  const ind = arr.findIndex((elt) => elt.id == id)
  return ind != null && ind != -1 && ind + 1 < arr.length ? ind + 1 : null
}


const useArrowShortcuts = () => {
  const { channelId, videoId, chapterId } = useAppStore((state) => state.selection)
  const { setChannel, setVideo, setChapter } = useAppStore((state) => state.actions)
  const queryCache = useQueryCache()


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
          const cachedVideo = getSelectionCache( { type: 'channel-video', key: channelId })

          if (cachedVideo == null) {
            const videos = channelId && queryCache.getVideos(channelId)
            if (videos && videos.length > 0) setVideo(videos[0].id)
          }
          if (cachedVideo != null) setVideo(cachedVideo.value)
        }

        if (activePane == 'video') {
          const cachedChapter = getSelectionCache( { type: 'video-chapter', key: videoId })

          if (cachedChapter == null) {
            const chapters = videoId && queryCache.getChapters(videoId)
            if (chapters && chapters.length > 0) setChapter(chapters[0].id)
          }
          if (cachedChapter != null) setChapter(cachedChapter.value)
        }
      },
    ],
    [
      'ArrowUp',() => {

        if (activePane == 'channel') {
          const channels = queryCache.getChannels()
          const ind = getPrevIndex(channels, channelId)
          ind != null && channels != null && setChannel(channels[ind].id)
        }

        if (activePane == 'video') {
          const videos = channelId == null ? undefined : queryCache.getVideos(channelId)
          const ind = getPrevIndex(videos, videoId)
          ind != null && videos != null && setVideo(videos[ind].id)
        }

        if (activePane == 'chapter') {
          const chapters = videoId == null ? undefined : queryCache.getChapters(videoId)
          const ind = getPrevIndex(chapters, chapterId)
          ind != null && chapters != null && setChapter(chapters[ind].id)

        }
      },
    ],
    [
      'ArrowDown',() => {

        if (activePane == 'channel') {
          const channels = queryCache.getChannels()
          const ind = getNextIndex(channels, channelId)
          ind != null && channels != null && setChannel(channels[ind].id)
        }

        if (activePane == 'video') {
          const videos = channelId == null ? undefined : queryCache.getVideos(channelId)
          const ind = getNextIndex(videos, videoId)
          ind != null && videos != null && setVideo(videos[ind].id)
        }

        if (activePane == 'chapter') {
          const chapters = videoId == null ? undefined : queryCache.getChapters(videoId)
          const ind = getNextIndex(chapters, chapterId)
          ind != null && chapters != null && setChapter(chapters[ind].id)
        }

      },
    ],
  ])
}


//  ===============================
//              COLUMNS
//  ===============================


function ChannelColumn() {
  const { classes: { column } } = useStyles()
  const channels = useFilteredChannels()

  return (
    <div className={column}>
      {channels.map((channel) => <ChannelItem key={channel.id} channel={channel}/>)}
    </div>
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

function ChapterColumn() {
  const { classes: { column } } = useStyles()
  const chapters = useFilteredChapters()

  return (
    <div className={column}>
      {chapters.map((chapter) => <ChapterItem key={chapter.id} chapter={chapter}/>)}
    </div>
  )
}

export default function MillerColumns() {
  useArrowShortcuts()

  return (
    <Grid>

      <Grid.Col span={3}>
        <ChannelColumn />
      </Grid.Col>

      <Grid.Col span={4}>
        <VideoColumn />
      </Grid.Col>

      <Grid.Col span={5}>
        <ChapterColumn />
      </Grid.Col>
    </Grid>
  )
}