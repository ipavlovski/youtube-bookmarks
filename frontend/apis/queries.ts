import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import superjson from 'superjson'


import type { AppRouter } from 'frontend/../trpc'
import { SERVER_URL } from 'frontend/apis/utils'
import { useAppStore, useYoutubeStore } from 'frontend/apis/stores'
import { Channel, Chapter, Video } from '@prisma/client'


////////////// TRPC / RQ

export const trpc = createTRPCReact<AppRouter>()

export const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `${SERVER_URL}/trpc`,
    }),
  ],
})

export const queryClient = new QueryClient({
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


export const useVideoForPlayback = () => {
  const videoId = useYoutubeStore((state) => state.videoId)
  const { data: videoForPlayback = null } = trpc.getVideoForPlayback.useQuery(
    videoId!, { enabled: videoId != null }
  )
  return videoForPlayback
}


export const useQueryCache = () => {
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
