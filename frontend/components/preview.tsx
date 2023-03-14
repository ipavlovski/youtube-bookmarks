import { Avatar, Container, Flex } from '@mantine/core'
import {
  SERVER_URL, useAppStore, useFilteredChannels, useFilteredChapters, useFilteredVideos
} from 'components/app'


export default function Preview() {
  const { channelId, videoId, chapterId } = useAppStore((state) => state.selection)
  const channels = useFilteredChannels()
  const videos = useFilteredVideos()
  const chapters = useFilteredChapters()

  const activePane: 'channel' | 'video' | 'chapter' | 'none' =
  channelId && videoId && chapterId ? 'chapter' :
    channelId && videoId ? 'video' :
      channelId ? 'channel' :
        'none'

  const images = activePane == 'none' ? channels.filter((channel) => channel.icon != null) : []

  const url = (src: string | null) => src && `${SERVER_URL}/images/${src}`

  return (
    <Container m={20}>
      <Flex wrap={'wrap'} gap={10}>
        {channels.map((channel) => (
          <Avatar key={channel.id} src={url(channel?.icon)} radius="xl">LL</Avatar>
        ))}
      </Flex>
    </Container>

  )
}