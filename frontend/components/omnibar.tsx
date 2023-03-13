import { Container, createStyles, MultiSelect } from '@mantine/core'
import { useState } from 'react'

const useStyles = createStyles((theme) => ({
  input: { backgroundColor: theme.colors.dark[7] }
}))

export default function Omnibar() {
  const { classes: { input: inputSx } } = useStyles()
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [allTags, setAllTags] = useState<{ name: string}[]>([])

  return (
    <Container size={'xs'}>
      <MultiSelect
        classNames={{ input: inputSx }} radius="lg"
        searchable creatable
        label="List of tags:" placeholder="Choose a tag..."
        data={allTags.map(({ name }) => ({ value: name, label: `#${name}` }))}
        value={selectedTags} onChange={setSelectedTags}
        getCreateLabel={(query) => `+ Create tag #${query}`}
        onCreate={(tagName) => { return setAllTags([...allTags, { name: tagName }]), tagName }}
      />
    </Container>
  )
}