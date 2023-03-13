import { inferAsyncReturnType, initTRPC } from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express'
import { z } from 'zod'
import superjson from 'superjson'

import * as h from 'backend/handlers'

// created for each request, return empty context
export const createContext = ({ req, res, }: trpcExpress.CreateExpressContextOptions) => ({})
type Context = inferAsyncReturnType<typeof createContext>;
const t = initTRPC.context<Context>().create({
  transformer: superjson,
})


export const appRouter = t.router({
  getChannels: t.procedure.input(
    z.object({
      title: z.string().optional()
    }).optional().default({})
  ).query(async ({ input: channelFilter }) => {
    return await h.getFilteredChannels(channelFilter)
  }),

  getVideos: t.procedure.input(
    z.object({
      title: z.string().optional(),
      channelId: z.number().optional()
    }).optional().default({})
  ).query(async ({ input: videoFilter }) => {
    return await h.getFilteredVideos(videoFilter)
  }),

  getChapters: t.procedure.input(
    z.object({
      title: z.string().optional(),
      videoId: z.number().optional()
    }).optional().default({})
  ).query(async ({ input: chapterFilter }) => {
    return await h.getFilteredChapters(chapterFilter)
  }),

})
