import { AspectRatio, Flex, Grid, Skeleton, Text } from '@mantine/core'
import { useCallback, useEffect, useRef } from 'react'
import YouTubePlayer from 'youtube-player'
import type { YouTubePlayer as YTPlayer } from 'youtube-player/dist/types'
import { create } from 'zustand'
import { ORIGIN_URL, useUiStore } from 'components/app'
import PlayerStates from 'youtube-player/dist/constants/PlayerStates'
import { useHotkeys } from '@mantine/hooks'

interface YoutubeStore {
  player: YTPlayer | null
  duration: number | null
  videoId: string | null
  actions: {
    setPlayer: (player: YTPlayer) => void
    setDuration: (duration: number) => void
    setVideoId: (videoId: string) => void
  }
}

export const useYoutubeStore = create<YoutubeStore>((set) => ({
  player: null,
  duration: null,
  videoId: null,
  actions: {
    setPlayer: (player) => set(() => ({ player })),
    setDuration: (duration) => set(() => ({ duration })),
    setVideoId: (videoId) => set(() => ({ videoId })),
  },
}))


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

  return {
    seekTo,
    cueVideo,
    togglePlayPause,
    fastForward,
    rewind,
    getPosition,
    getStatus,
    getDuration,
  }
}

function ProgressMarker({ marker }: {marker: number}) {

  // const controls = useYoutubeControls()

  const percent = (ms: number, duration: number) => Math.floor((ms / duration!) * 100)
  const clickHandler =() => {
    // controls && controls.seekTo()

  }


  return (
    <div style={{
      position: 'absolute',
      height: 12,
      width: 6,
      backgroundColor: 'green',
      left: `${percent}%`,
      cursor: 'pointer'
    }}
    onClick={() => clickHandler()}
    >
    </div>
  )
}


function ProgressBar() {

  const markers = [1000, 2000, 5000, 10000]

  const clickHandler = () => {
    console.log('bar!')
  }

  return (
    <div style={{
      height: 12,
      backgroundColor: 'grey',
      marginTop: 10
    }}>
      <div style={{ position: 'relative' }}>
        {/* {markers.map((marker) => <ProgressMarker key={marker} marker={marker} />)} */}
      </div>
    </div>
  )
}


const useYoutubeShortcuts = () => {
  const { togglePlayPause, fastForward, rewind } = YoutubeControls()

  useHotkeys([
    ['space', async () => togglePlayPause()],
    ['.', async () => fastForward()],
    [',', async () => rewind()],
  ])
}

function Player() {
  const { setPlayer } = useYoutubeStore((state) => state.actions)
  const youtubeRef = useRef<HTMLDivElement>(null)
  useYoutubeShortcuts()

  useEffect(() => {
    if (! youtubeRef.current) return
    const player = YouTubePlayer(youtubeRef.current, {
      // videoId: '_JQAve05o_0',
      playerVars: {
        enablejsapi: 1,
        origin: ORIGIN_URL,
        modestbranding: 1,
      },
    })

    player.on('ready', () => {
      console.log('player ready.')
      setPlayer(player)
    })

    player.on('stateChange', async () => {
      const stateCode = await player.getPlayerState()
      const status = Object.entries(PlayerStates).find((v) => v[1] == stateCode)?.[0]
      console.log(`youtube status: ${status}`)
      if (status == 'VIDEO_CUED') {
        const url = await player.getVideoUrl()
        const videoId = new URL(url).searchParams.get('v')
        console.log(`cued video id: ${videoId}`)
      }
    })
  }, [])

  // {/* <Skeleton animate={false} /> */}
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