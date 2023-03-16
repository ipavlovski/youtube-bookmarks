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
    z.object({}).optional()
  ).query(async () => {
    return await h.getChannels()
  }),

  getVideos: t.procedure.input(
    z.object({
      channelId: z.number()
    })
  ).query(async ({ input }) => {
    return await h.getVideos(input)
  }),

  getChapters: t.procedure.input(
    z.object({
      videoId: z.number()
    })
  ).query(async ({ input }) => {
    return await h.getChapters(input)
  }),

  getVideoForPlayback: t.procedure.input(
    z.string().length(11)
  ).query(async ({ input }) => {
    return await h.getVideoForPlayback(input)
  })

})
