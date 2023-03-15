import { Popover, UnstyledButton, Group, TextInput, Select, FileButton, Button } from '@mantine/core'
import { IconBook, IconCirclePlus, IconCheck } from '@tabler/icons-react'
import { useUiStore } from 'components/app'

function CaptureButton() {
  return (
    <Popover width={350} position="bottom-start" withArrow shadow="md" radius="sm">

      <Popover.Target>
        <Button p={0} m={0}>
          <IconBook size={20} stroke={1.5} />
          CAPTURE
        </Button>
      </Popover.Target>

      <Popover.Dropdown>
        <TextInput />
      </Popover.Dropdown>
    </Popover>
  )
}

export default function Header() {

  const { toggleComments, toggleDescription, togglePreview } = useUiStore((state) => state.actions)

  return (
    <div style={{ height: 48 }}>
      <button style={{ marginRight: 10 }} onClick={() => toggleDescription()}>
        Toggle Description
      </button>
      <button style={{ marginRight: 10 }} onClick={() => toggleComments()}>
        Toggle Comments
      </button>
      <button style={{ marginRight: 10 }} onClick={() => togglePreview()}>
        Toggle Preview
      </button>
      <CaptureButton />
    </div>
  )
}