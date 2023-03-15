import {
  Container, createStyles, MantineProvider, MantineThemeOverride, MultiSelect, Text
} from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import superjson from 'superjson'
import { create } from 'zustand'

import type { AppRouter } from 'frontend/../trpc'
import YoutubeIframe from 'components/youtube-iframe'
import Omnibar from 'components/omnibar'
import Preview from 'components/preview'
import MillerColumns from 'components/miller-columns'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`
export const ORIGIN_URL = `https://localhost:${import.meta.env.VITE_PORT}`

////////////// STYLES

const globalTheme: MantineThemeOverride = {
  fontFamily: 'Hack',
  colorScheme: 'dark',
  colors: {
    'ocean-blue': ['#7AD1DD', '#5FCCDB', '#44CADC', '#2AC9DE', '#1AC2D9',
      '#11B7CD', '#09ADC3', '#0E99AC', '#128797', '#147885'],
    'cactus': ['#2BBC8A', '#405d53']
  },
}

////////////// STORES


type SelectionCacheItem = { type: 'video-chapter' | 'channel-video', key: number, value: number }
const selectionCache: SelectionCacheItem[] = []
function setSelectionCache(item: SelectionCacheItem) {
  const CACHE_MAX_ITEMS = 500
  selectionCache.length + 1 <= CACHE_MAX_ITEMS ?
    selectionCache.unshift(item) :
    (selectionCache.pop(), selectionCache.unshift(item))
}
export function getSelectionCache({ type, key }: Pick<SelectionCacheItem, 'type' | 'key'>) {
  return selectionCache.find((item) => item.type == type && item.key == key)
}


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
  actions: {
    toggleDescription: (shouldShow?: boolean) => void
    toggleComments: (shouldSHow?: boolean) => void
  }
}
export const useUiStore = create<UiState>((set) => ({
  showDescription: false,
  showComments: false,
  actions: {
    toggleComments: (shouldShow) => set((state) =>
      ({ showComments: shouldShow == null ? ! state.showComments : shouldShow })),
    toggleDescription: (shouldShow) => set((state) =>
      ({ showDescription: shouldShow == null ? ! state.showDescription : shouldShow }))
  }
}))


////////////// TRPC / RQ

export const trpc = createTRPCReact<AppRouter>()

const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `${SERVER_URL}/trpc`,
    }),
  ],
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})


////////////// QUERIES

export const useFilteredChannels = () => {
  const { data: channels = [] } = trpc.getChannels.useQuery()

  return channels
}

export const useFilteredVideos = () => {
  const selectedChannel = useAppStore((state) => state.selection.channelId)
  const { data: videos = [] } = trpc.getVideos.useQuery(
    { channelId: selectedChannel! }, { enabled: selectedChannel != null }
  )

  return videos
}

export const useFilteredChapters = () => {
  const selectedVideo = useAppStore((state) => state.selection.videoId)
  const { data: chapters = [] } = trpc.getChapters.useQuery(
    { videoId: selectedVideo! }, { enabled: selectedVideo != null }
  )

  return chapters
}


////////////// STYLES

const useStyles = createStyles((theme) => ({}))


////////////// APP

function Header() {

  const { toggleComments, toggleDescription } = useUiStore((state) => state.actions)

  return (
    <div style={{ height: 32 }}>
      <button style={{ marginRight: 10 }} onClick={() => toggleDescription()}>
        Toggle Description
      </button>
      <button style={{ marginRight: 10 }} onClick={() => console.log('click2')}>button2</button>
      <button style={{ marginRight: 10 }} onClick={() => console.log('click3')}>button3</button>
    </div>
  )
}

function Root() {
  const { classes } = useStyles()

  return (
    <>
      <Header />
      <YoutubeIframe />
      <Container pt={16} size={'lg'}>
        {/* <Preview /> */}
        <MillerColumns />
      </Container>
    </>

  )
}


export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider withGlobalStyles withNormalizeCSS theme={globalTheme}>
          <Notifications />
          <Root />
        </MantineProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </trpc.Provider>

  )
}
