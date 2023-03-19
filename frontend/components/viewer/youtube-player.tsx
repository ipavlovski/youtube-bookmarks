import { useEffect, useRef } from 'react'
import YouTubePlayer from 'youtube-player'

import { useYoutubeShortcuts, YoutubeControls } from 'frontend/apis/hooks'
import { useUiStore, useYoutubeStore } from 'frontend/apis/stores'
import { ORIGIN_URL } from 'frontend/apis/utils'


export default function Player() {
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
    })

    const { getVideoId, getStatus } = YoutubeControls

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
