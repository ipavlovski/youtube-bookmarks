import { ActionIcon, AspectRatio, Button, createStyles, Flex, Grid, Group, HoverCard, Popover, Skeleton,
  Image, Text, Textarea, TextInput } from '@mantine/core'
import { useCallback, useEffect, useRef, useState, ClipboardEvent } from 'react'
import YouTubePlayer from 'youtube-player'
import type { YouTubePlayer as YTPlayer } from 'youtube-player/dist/types'
import { create } from 'zustand'
import { ORIGIN_URL, trpc, useAppStore, useUiStore, useVideoForPlayback } from 'components/app'
import PlayerStates from 'youtube-player/dist/constants/PlayerStates'
import { useDisclosure, useHotkeys, useHover } from '@mantine/hooks'
import { Chapter } from '@prisma/client'
import { IconCheck } from '@tabler/icons-react'
import { Duration } from 'luxon'

export const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`

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
  const [opened, { open, toggle, close }] = useDisclosure(false)
  const [base64, setBase64] = useState<string | ArrayBuffer | null>(null)
  const [titleValue, setTitleValue] = useState('')

  const utils = trpc.useContext()
  const createChapter = trpc.createChapter.useMutation()

  const timestamp = Duration.fromObject({ seconds: hoverPosition }).toISOTime().match(/(00:)?(.*)/)?.[2]

  const blobToBase64 = async (blob: Blob): Promise<string | ArrayBuffer | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(blob)
    })
  }

  const pasteHandler = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardText = e.clipboardData?.getData('Text').trim() || ''
    const indNewLine = clipboardText.indexOf('\n')
    const firstLine = clipboardText.substring(0, indNewLine)
    const restLines = clipboardText.substring(indNewLine + 1)
    const isBase64 = /^data:.*:base64/.test(firstLine)

    // handle base64
    if (isBase64) {
      e.stopPropagation()
      e.preventDefault()
      setBase64(`data:video/mp4;base64,${restLines}`)
      return
    }

    // handlethe image scenario
    const query = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName })
    if (query.state == 'granted' || query.state == 'prompt') {
      const clipboard = await navigator.clipboard.read()
      if (clipboard[0].types.includes('image/png')) {
        const blob = await clipboard[0].getType('image/png')
        const b64 = await blobToBase64(blob)
        setBase64(b64)
      }
    }
  }


  const enterHandler = async () => {
    const { getPosition } = YoutubeControls()
    const position = await getPosition()
    ! opened && setHoverPosition(position || 0)
  }

  const submitHandler = async () => {
    if (hoverPosition != 0 && titleValue != '' && base64 != null &&
        typeof base64 == 'string' && video?.videoId) {

      //create new chapter
      await createChapter.mutateAsync({
        base64: base64.replace(/^data:(.*,)?/, ''),
        videoId: video.videoId,
        timestamp: hoverPosition,
        title: titleValue
      }, {
        onSuccess: () => {
          utils.getChapters.invalidate()
          utils.getVideoForPlayback.invalidate()
        },
      })

      // on success, clear the inputs
      setBase64(null)
      setTitleValue('')
      close()
    }

  }

  const clickHandler = () => {
    console.log(`clicked bar!: ${opened}`)
    open()
  }

  return (
    <div className={bar} onMouseEnter={enterHandler} ref={ref} onClick={clickHandler}>
      <div style={{ position: 'relative' }}>
        {/* chapter markers */}
        {video &&
        video.chapters.map((chapter) =>
          (<ProgressMarker key={chapter.id} chapter={chapter} duration={video.duration} />))}

        {/* hover/click capture */}
        {(hovered || opened) && hoverPosition != 0 && video != null && (
          <Popover width={350} trapFocus position="bottom"
            withArrow shadow="md" opened={opened} onChange={toggle}>
            <Popover.Target>
              <div className={marker} onClick={open}
                style={{ left: `${percent(hoverPosition, video.duration)}%` }} />
            </Popover.Target>

            <Popover.Dropdown >
              <Flex align={'center'}>

                {/* TIMESTAMP */}
                <Text>{video.videoId} @ {timestamp} s</Text>

                <ActionIcon color="lime" size="sm" radius="xl" variant="filled" m={10}
                  disabled={hoverPosition == 0 || titleValue == '' || base64 == null}
                  onClick={submitHandler} >
                  <IconCheck size="1.625rem" />
                </ActionIcon>
              </Flex>

              {/* TITLE + PREVIEW INPUT */}
              <Textarea onPaste={pasteHandler} autosize
                value={titleValue} onChange={(e) => setTitleValue(e.currentTarget.value)}
                placeholder="Add title" style={{ width: 300 }}/>

              {/* PREVIEW */}
              {typeof base64 == 'string' && base64.startsWith('data:video/mp4') &&
              <AspectRatio ratio={16 / 9} m={8} p={0} >
                <video controls height={120} width={300} >
                  <source type="video/mp4" src={base64} />
                </video>
              </AspectRatio>}

              {typeof base64 == 'string' && base64.startsWith('data:image/png') &&
                      <Image m={8} height={120} width={300} radius='sm' src={base64} />}

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
  const { seekTo } = YoutubeControls()

  const clickHandler =() => {
    console.log(`clicked on ${title}: ${capture}`)
    seekTo(timestamp)
  }

  return (

    <HoverCard width={280} shadow="md">
      <HoverCard.Target>
        <div className={marker}
          style={{ left: `${percent(timestamp, duration)}%`, backgroundColor: 'red' }}
          onClick={() => clickHandler()}/>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <Text size="sm">{title}</Text>
        <Image
          height={120} width={200}
          radius='sm'
          src={capture.endsWith('.mp4') ?
            `${SERVER_URL}/capture/${capture}`.replace('.mp4', '.gif') :
            `${SERVER_URL}/capture/${capture}`}
          withPlaceholder
          placeholder={<Text align="center">No thumbnail found yet.</Text>}
          style={{ cursor: 'pointer' }}
        />
      </HoverCard.Dropdown>
    </HoverCard>


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