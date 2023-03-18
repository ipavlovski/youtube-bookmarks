import { ActionIcon, Button, Group, Popover, Text, Textarea } from '@mantine/core'
import { IconBook, IconCheck } from '@tabler/icons-react'
import { useUiStore } from 'components/app'
import { YoutubeControls } from 'components/youtube-iframe'
import { ClipboardEvent, useState } from 'react'


function CaptureButton() {

  const [base64, setBase64] = useState<string | ArrayBuffer | null>(null)
  const [timestamp, setTimestamp] = useState(0)
  const [videoId, setVideoId] = useState('')


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


  const openHandler = async () => {
    const { getPosition, getVideoId } = YoutubeControls
    const position = await getPosition()
    setTimestamp(position || 0)
    const videoId = await getVideoId()
    setVideoId(videoId || '')
  }

  return (
    <Popover position="bottom-start" withArrow shadow="md" radius="sm" onOpen={openHandler}>

      <Popover.Target>
        <Button p={0} m={0}>
          <IconBook size={20} stroke={1.5} />
          CAPTURE
        </Button>
      </Popover.Target>

      <Popover.Dropdown >
        <Group >

          {/* TIMESTAMP */}
          <Text>{videoId} @ {timestamp} s</Text>

          <ActionIcon color="lime" size="sm" radius="xl" variant="filled" disabled m={10}>
            <IconCheck size="1.625rem" />
          </ActionIcon>
        </Group>

        {/* TITLE + PREVIEW INPUT */}
        <Textarea onPaste={pasteHandler} autosize placeholder="Add title" style={{ width: 300 }}/>

        {/* PREVIEW */}
        {typeof base64 == 'string' && base64.startsWith('data:video/mp4') &&
        <video controls>
          <source type="video/mp4" src={base64} />
        </video> }
        {typeof base64 == 'string' && base64.startsWith('data:image/png') &&
          <img src={base64}/> }

      </Popover.Dropdown>
    </Popover>
  )
}

export default function Header() {
  const showPreview = useUiStore((state) => state.showPreview)
  const { toggleComments, toggleDescription, togglePreview } = useUiStore((state) => state.actions)

  return (
    <div style={{ height: 48 }}>
      <button style={{ marginRight: 10 }} onClick={() => toggleDescription()}>
        Toggle Description
      </button>
      <button style={{ marginRight: 10 }} onClick={() => toggleComments()}>
        Toggle Comments
      </button>
      <button style={{ marginRight: 10 }} onClick={() => {
        console.log('show preview:', showPreview)
        togglePreview()
      }}>
        Toggle Preview
      </button>
      <CaptureButton />
    </div>
  )
}
