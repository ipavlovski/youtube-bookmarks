import { AspectRatio, Skeleton } from '@mantine/core'
import { useUiStore } from 'components/app'


export default function Preview() {

  const showPreview = useUiStore((state) => state.showPreview)
  // const { togglePreview } = useUiStore((state) => state.actions)

  return (
    <AspectRatio ratio={16 / 9} mx="auto" p={0} style={{ display: showPreview ? 'block' : 'none' }}>
      <Skeleton animate={false}/>
    </AspectRatio>

  )
}