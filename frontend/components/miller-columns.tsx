import { Avatar, createStyles, Flex, Grid, Group, Image, Text } from '@mantine/core'
import { Channel, Video } from '@prisma/client'
import { IconUser } from '@tabler/icons-react'
import { useArrowShortcuts, YoutubeControls } from 'frontend/apis/hooks'
import { useFilteredChannels, useFilteredChapters, useFilteredVideos } from 'frontend/apis/queries'
import { useAppStore, useYoutubeStore } from 'frontend/apis/stores'
import { getCaptureUrl, getImageUrl } from 'frontend/apis/utils'


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
  const playerVideoId = useYoutubeStore((state) => state.videoId)

  const { cueVideo } = YoutubeControls

  const titleClickHandler = () => {
    setVideo(video.id)
  }

  const thumbnailClickHandler = () => {
    // if the same video is already playing, don't do anything
    if ( playerVideoId == video.videoId ) return

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


function ChapterItem({ chapter: { id, timestamp, title, capture, video } }:
{chapter: Awaited<ReturnType<typeof useFilteredChapters>>[0]}) {

  const { classes: { active }, cx } = useStyles()
  const { setChapter } = useAppStore((state) => state.actions)
  const selectedChapter = useAppStore((state) => state.selection.chapterId)
  const { setVideoId } = useYoutubeStore((state) => state.actions)
  const playerVideoId = useYoutubeStore((state) => state.videoId)

  const { seekTo, cueVideo } = YoutubeControls

  const titleClickHandler = () => {
    setChapter(id)
  }

  const thumbnailClickHandler = () => {
    if ( playerVideoId == video.videoId ) {
      seekTo(timestamp)
    } else {
      cueVideo(video.videoId, timestamp)
      setVideoId(video.videoId)
    }
  }

  return (
    <Group align={'center'} mt={10} spacing={2}>

      <Text truncate size={'sm'}
        className={cx(id == selectedChapter && active)}
        onClick={titleClickHandler}>
        {title}
      </Text>

      <Image
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