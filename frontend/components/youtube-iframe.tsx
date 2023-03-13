import { AspectRatio, Flex, Grid, Skeleton } from '@mantine/core'


export default function YoutubeIframe() {
  return (
    <Grid>
      <Grid.Col span={8}>
        <AspectRatio ratio={16 / 9} mx="auto" my={20} >
          <Skeleton animate={false} radius="lg" />
        </AspectRatio>
      </Grid.Col>
      <Grid.Col span={4}>
        <Skeleton animate={false} radius="lg" />
      </Grid.Col>
    </Grid>

  )
}