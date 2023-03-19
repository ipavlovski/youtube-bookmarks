import { create } from 'zustand'
import type { YouTubePlayer as YTPlayer } from 'youtube-player/dist/types'

import { setSelectionCache } from 'frontend/apis/utils'


type Selection = { channelId: number | null, videoId: number | null, chapterId: number | null }
interface AppStore {
  selection: Selection
  actions: {
    setChannel: (channelId: number) => void
    setVideo: (videoId: number) => void
    setChapter: (chapterId: number) => void
  }
}


export const useAppStore = create<AppStore>((set) => ({
  selection: { channelId: null, videoId: null, chapterId: null },
  actions: {
    setChannel: (newChannelId) => set((state) => {
      const { channelId, videoId, chapterId } = state.selection

      if (chapterId != null && videoId != null)
        setSelectionCache({ type: 'video-chapter', key: videoId, value: chapterId })
      if (channelId != null && videoId != null)
        setSelectionCache({ type: 'channel-video', key: channelId, value: videoId })

      return { selection: { channelId: newChannelId, videoId: null, chapterId: null, } }
    }),
    setVideo: (newVideoId) => set((state) => {
      const { channelId, videoId, chapterId } = state.selection

      if (chapterId != null && videoId != null)
        setSelectionCache({ type: 'video-chapter', key: videoId, value: chapterId })
      if (channelId != null && videoId != null)
        setSelectionCache({ type: 'channel-video', key: channelId, value: videoId })

      return { selection: { channelId: channelId, videoId: newVideoId, chapterId: null, } }
    }),
    setChapter: (newChapterId) => set((state) => {
      const { channelId, videoId, chapterId } = state.selection

      if (chapterId != null && videoId != null)
        setSelectionCache({ type: 'video-chapter', key: videoId, value: chapterId })

      return { selection: { channelId: channelId, videoId: videoId, chapterId: newChapterId, } }
    })
  }
}))


interface UiState {
  showDescription: boolean
  showComments: boolean
  showPreview: boolean
  actions: {
    toggleDescription: (shouldShow?: boolean) => void
    toggleComments: (shouldShow?: boolean) => void
    togglePreview: (shouldShow?: boolean) => void
  }
}
export const useUiStore = create<UiState>((set) => ({
  showDescription: false,
  showComments: false,
  showPreview: false,
  actions: {
    toggleComments: (shouldShow) => set((state) =>
      ({ showComments: shouldShow == null ? ! state.showComments : shouldShow })),
    toggleDescription: (shouldShow) => set((state) =>
      ({ showDescription: shouldShow == null ? ! state.showDescription : shouldShow })),
    togglePreview: (shouldShow) => set((state) =>
      ({ showPreview: shouldShow == null ? ! state.showPreview : shouldShow }))
  }
}))


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
