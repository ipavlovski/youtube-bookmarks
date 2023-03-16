import { AspectRatio, Button, createStyles, Flex, Grid, Popover, Skeleton, Text, TextInput } from '@mantine/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import YouTubePlayer from 'youtube-player'
import type { YouTubePlayer as YTPlayer } from 'youtube-player/dist/types'
import { create } from 'zustand'
import { ORIGIN_URL, useAppStore, useUiStore, useVideoForPlayback } from 'components/app'
import PlayerStates from 'youtube-player/dist/constants/PlayerStates'
import { useDisclosure, useHotkeys, useHover } from '@mantine/hooks'
import { Chapter } from '@prisma/client'

interface YoutubeStore {
  player: YTPlayer | null
  videoId: string | null
  actions: {
    setPlayer: (player: YTPlayer) => void
    setVideoId: (videoId: string) => void
  }
}

export const useYoutubeStore = create<YoutubeStore>((set) => ({
  player: null,
  videoId: null,
  actions: {
    setPlayer: (player) => set(() => ({ player })),
    setVideoId: (videoId) => set(() => ({ videoId })),
  },
}))


const useYoutubeShortcuts = () => {
  const { togglePlayPause, fastForward, rewind } = YoutubeControls()

  useHotkeys([
    ['space', async () => togglePlayPause()],
    ['.', async () => fastForward()],
    [',', async () => rewind()],
    ['<', async () => console.log('decrease playback rate')],
    ['>', async () => console.log('increase playback rate')],
  ])
}

export const YoutubeControls = () => {
  const seekTo = async (seconds: number) => {
    const player = useYoutubeStore.getState().player
    await player?.seekTo(seconds, true)
  }

  const cueVideo = async (videoId: string, startSeconds?: number) => {
    const player = useYoutubeStore.getState().player
    await player?.cueVideoById(videoId, startSeconds)
  }

  const togglePlayPause = async () => {
    const player = useYoutubeStore.getState().player
    const status = await getStatus()
    status == 'PLAYING' ? player?.pauseVideo() : player?.playVideo()
  }

  const fastForward = async () => {
    const position = await getPosition()
    position != null && await seekTo(position + 0.2)
  }

  const rewind = async () => {
    const position = await getPosition()
    position != null && await seekTo(position - 0.2)
  }

  const getPosition = async () => {
    const player = useYoutubeStore.getState().player
    return player?.getCurrentTime().then((currentTime) => Math.round(currentTime * 1000) / 1000)
  }

  const getStatus = async () => {
    const player = useYoutubeStore.getState().player
    const stateCode = await player?.getPlayerState()
    return Object.entries(PlayerStates).find((v) => v[1] == stateCode)?.[0]
  }

  const getDuration = async () => {
    const player = useYoutubeStore.getState().player
    return player?.getDuration()
  }

  const getVideoId = async () => {
    const player = useYoutubeStore.getState().player
    const url = await player?.getVideoUrl() || null
    return url && new URL(url).searchParams?.get('v')
  }

  return {
    seekTo,
    cueVideo: cueVideo,
    togglePlayPause,
    fastForward,
    rewind,
    getPosition,
    getStatus,
    getDuration,
    getVideoId
  }
}


const useStyles = createStyles((theme) => ({
  bar: {
    height: 18,
    backgroundColor: '#a9a9a9',
    marginTop: 10,
  },
  marker: {
    position: 'absolute',
    height: 18,
    width: 6,
    backgroundColor: 'green',
    cursor: 'pointer',
  }
}))


const percent = (current: number, duration: number) => Math.round(current/duration * 10000) / 100

function ProgressBar() {
  const video = useVideoForPlayback()
  const { classes: { bar, marker } } = useStyles()
  const { hovered, ref } = useHover()
  const [hoverPosition, setHoverPosition] = useState(0)
  const [opened, { close, open, toggle }] = useDisclosure(false)

  const enterHandler = async () => {
    const { getPosition } = YoutubeControls()
    const position = await getPosition()
    ! opened && setHoverPosition(position || 0)
  }

  return (
    <div className={bar} onMouseEnter={enterHandler} ref={ref} onClick={open}>
      <div style={{ position: 'relative' }}>
        {/* chapter markers */}
        {video &&
        video.chapters.map((chapter) =>
          (<ProgressMarker key={chapter.id} chapter={chapter} duration={video.duration} />))}

        {/* hover/click capture */}
        {(hovered || opened) && hoverPosition != 0 && video != null && (
          <Popover width={300} trapFocus position="bottom"
            withArrow shadow="md" opened={opened} onChange={toggle}>
            <Popover.Target>
              <div className={marker} onClick={open}
                style={{ left: `${percent(hoverPosition, video.duration)}%` }} />
            </Popover.Target>
            <Popover.Dropdown>

              <TextInput label="Name" placeholder="Name" size="xs" />
              <TextInput label="Email" placeholder="john@doe.com" size="xs" mt="xs" />

            </Popover.Dropdown>
          </Popover>
        )}

      </div>
    </div>
  )
}

function ProgressMarker({ chapter, duration }: {chapter: Chapter, duration: number }) {
  const { timestamp, title, capture } = chapter
  const { classes: { marker } } = useStyles()

  const clickHandler =() => { console.log(`clicked on ${title}`) }

  return (
    <div className={marker} style={{ left: `${Math.floor(timestamp / duration) * 100}%` }}
      onClick={() => clickHandler()}
    >
    </div>
  )
}


function Player() {
  const { setPlayer } = useYoutubeStore((state) => state.actions)
  const showPreview = useUiStore((state) => state.showPreview)
  const youtubeRef = useRef<HTMLDivElement>(null)
  useYoutubeShortcuts()

  useEffect(() => {
    console.log(`Loading youtube with preview: ${showPreview}`)
    if (! youtubeRef.current) return
    const player = YouTubePlayer(youtubeRef.current, {
      playerVars: {
        enablejsapi: 1,
        origin: ORIGIN_URL,
        modestbranding: 1,
        controls: 1
      },
      // videoId: '_JQAve05o_0',
      // events: {
      //   ready: () => console.log('ready')
      // }
    })

    const { getVideoId, getStatus } = YoutubeControls()

    player.on('ready', () => {
      console.log('player ready.')
      setPlayer(player)
    })

    player.on('stateChange', async () => {
      const status = await getStatus()
      const videoId = await getVideoId()
      console.log(`status: ${status}, videoId: ${videoId}`)
    })
  }, [showPreview])

  return <div ref={youtubeRef} />
}

function VideoDescription({ description }: {description: string}) {
  return (
    <Text>{description}</Text>
  )
}


export default function YoutubeIframe() {
  const shouldShowDescription = useUiStore((state) => state.showDescription)

  return (
    <>
      <Grid>
        <Grid.Col span={shouldShowDescription ? 8 : 12}>
          <AspectRatio ratio={16 / 9} mx="auto" p={0} >
            <Player />
          </AspectRatio>
          <ProgressBar />
        </Grid.Col>
        {shouldShowDescription &&
        <Grid.Col span={4}>
          <VideoDescription description={'asdf'}/>
        </Grid.Col>}
      </Grid>
    </>
  )
}