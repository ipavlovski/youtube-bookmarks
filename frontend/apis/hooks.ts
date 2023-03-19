import { useHotkeys } from '@mantine/hooks'
import PlayerStates from 'youtube-player/dist/constants/PlayerStates'

import { useQueryCache } from 'frontend/apis/queries'
import { useAppStore, useYoutubeStore } from 'frontend/apis/stores'
import { getSelectionCache } from 'frontend/apis/utils'


export const YoutubeControls = {
  async seekTo(seconds: number) {
    const player = useYoutubeStore.getState().player
    await player?.seekTo(seconds, true)
  },

  async cueVideo(videoId: string, startSeconds?: number) {
    const player = useYoutubeStore.getState().player
    await player?.cueVideoById(videoId, startSeconds)
  },

  async togglePlayPause() {
    const player = useYoutubeStore.getState().player
    const status = await this.getStatus()
    status == 'PLAYING' ? player?.pauseVideo() : player?.playVideo()
  },

  async fastForward() {
    const position = await this.getPosition()
    position != null && await this.seekTo(position + 0.2)
  },

  async rewind() {
    const position = await this.getPosition()
    position != null && await this.seekTo(position - 0.2)
  },

  async getPosition() {
    const player = useYoutubeStore.getState().player
    return player?.getCurrentTime().then((currentTime) => Math.round(currentTime * 1000) / 1000)
  },

  async getStatus() {
    const player = useYoutubeStore.getState().player
    const stateCode = await player?.getPlayerState()
    return Object.entries(PlayerStates).find((v) => v[1] == stateCode)?.[0]
  },

  async getDuration() {
    const player = useYoutubeStore.getState().player
    return player?.getDuration()
  },

  async getVideoId() {
    const player = useYoutubeStore.getState().player
    const url = await player?.getVideoUrl() || null
    return url && new URL(url).searchParams?.get('v')
  }
}


export const useYoutubeShortcuts = () => {
  const { togglePlayPause, fastForward, rewind } = YoutubeControls

  useHotkeys([
    ['space', async () => togglePlayPause()],
    ['.', async () => fastForward()],
    [',', async () => rewind()],
    ['<', async () => console.log('decrease playback rate')],
    ['>', async () => console.log('increase playback rate')],
  ])
}

export const useArrowShortcuts = () => {
  const { channelId, videoId, chapterId } = useAppStore((state) => state.selection)
  const { setChannel, setVideo, setChapter } = useAppStore((state) => state.actions)
  const queryCache = useQueryCache()

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

  const activePane: 'channel' | 'video' | 'chapter' =
    channelId && videoId && chapterId ? 'chapter' : channelId && videoId ? 'video' : 'channel'

  useHotkeys([
    ['ArrowLeft', () => {
      if (activePane == 'chapter') videoId != null && setVideo(videoId)
      if (activePane == 'video') channelId != null && setChannel(channelId)
    }],

    ['ArrowRight',() => {

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
    }],

    ['ArrowUp',() => {

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
    }],

    ['ArrowDown',() => {

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
    }],
  ])
}
