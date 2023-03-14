import { AspectRatio, Flex, Grid, Skeleton } from '@mantine/core'
import { useEffect, useRef } from 'react'
import YouTubePlayer from 'youtube-player'
import type { YouTubePlayer as YTPlayer } from 'youtube-player/dist/types'
import { create } from 'zustand'
import { ORIGIN_URL } from 'components/app'
import PlayerStates from 'youtube-player/dist/constants/PlayerStates'

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


function Player() {
  // const { durationSetter } = useDurationSetter()
  const { setPlayer } = useYoutubeStore((state) => state.actions)
  const youtubeRef = useRef<HTMLDivElement>(null)

  const defaultVideoId = '_JQAve05o_0'

  useEffect(() => {
    const player = YouTubePlayer(youtubeRef.current!, {
      videoId: defaultVideoId,
      playerVars: {
        enablejsapi: 1,
        origin: ORIGIN_URL,
        modestbranding: 1,
      },
    })

    player.on('ready', () => {
      setPlayer(player)
    })

    player.on('stateChange', async (e) => {
      const stateCode = await player.getPlayerState()
      const status = Object.entries(PlayerStates).find((v) => v[1] == stateCode)![0]
      console.log(`youtube status: ${status}`)
      if (status == 'VIDEO_CUED') {
        const url = await player.getVideoUrl()
        const duration = await player.getDuration()
        const videoId = new URL(url).searchParams.get('v')!
        // videoId != defaultVideoId && durationSetter([url, duration])
      }
    })
  }, [])

  return <div ref={youtubeRef} />
}

export default function YoutubeIframe() {
  return (
    <AspectRatio ratio={16 / 9} mx="auto" p={0} >
      <Player />
    </AspectRatio>
  )
}