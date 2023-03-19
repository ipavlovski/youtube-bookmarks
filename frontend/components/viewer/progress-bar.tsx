import { ActionIcon, AspectRatio, createStyles, Flex, HoverCard, Image, Popover, Text, Textarea } from '@mantine/core'
import { useDisclosure, useHover } from '@mantine/hooks'
import { Chapter } from '@prisma/client'
import { IconCheck } from '@tabler/icons-react'
import { Duration } from 'luxon'
import { ClipboardEvent, useState } from 'react'

import { YoutubeControls } from 'frontend/apis/hooks'
import { trpc, useVideoForPlayback } from 'frontend/apis/queries'
import { getCaptureUrl, percent } from 'frontend/apis/utils'


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

function ProgressMarker({ chapter, duration }: {chapter: Chapter, duration: number }) {
  const { timestamp, title, capture } = chapter
  const { classes: { marker } } = useStyles()
  const { seekTo } = YoutubeControls

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
          src={getCaptureUrl(capture)}
          withPlaceholder
          placeholder={<Text align="center">No thumbnail found yet.</Text>}
          style={{ cursor: 'pointer' }}
        />
      </HoverCard.Dropdown>
    </HoverCard>


  )
}
export default function ProgressBar() {
  const video = useVideoForPlayback()
  const { classes: { bar, marker } } = useStyles()
  const { hovered, ref } = useHover()
  const [hoverPosition, setHoverPosition] = useState(0)
  const [opened, { open, toggle, close }] = useDisclosure(false)
  const [base64, setBase64] = useState<string | ArrayBuffer | null>(null)
  const [titleValue, setTitleValue] = useState('')

  const utils = trpc.useContext()
  const createChapter = trpc.createChapter.useMutation()

  const formatDuration = (seconds: number) => {
    return Duration.fromObject({ seconds: hoverPosition }).toISOTime().match(/(00:)?(.*)/)?.[2]
  }

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
    const { getPosition } = YoutubeControls
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
                <Text>{formatDuration(hoverPosition)} s</Text>

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
