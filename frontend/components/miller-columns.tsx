import { Grid, Skeleton } from '@mantine/core'


export default function MillerColumns() {
  return (
    <Grid>
      <Grid.Col span={3}>
        <Skeleton radius="lg" height={400} animate={false} />
      </Grid.Col>

      <Grid.Col span={6}>
        <Skeleton radius="lg" height={400} animate={false} />
      </Grid.Col>

      <Grid.Col span={3}>
        <Skeleton radius="lg" height={400} animate={false} />
      </Grid.Col>
    </Grid>
  )
}