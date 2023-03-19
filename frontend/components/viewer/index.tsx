import { AspectRatio, Grid, Text } from '@mantine/core'

import ProgressBar from 'components/viewer/progress-bar'
import Player from 'components/viewer/youtube-player'
import { useUiStore } from 'frontend/apis/stores'


function VideoDescription({ description }: {description: string}) {
  return (
    <Text>{description}</Text>
  )
}

export default function Viewer() {
  const shouldShowDescription = useUiStore((state) => state.showDescription)
  const showPreview = useUiStore((state) => state.showPreview)

  return (
    <>
      <Grid style={{ display: showPreview ? 'none' : 'block' }}>
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