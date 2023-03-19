import { Button, createStyles, Flex, MultiSelect } from '@mantine/core'
import { useUiStore } from 'components/app'
import { useState } from 'react'

const useStyles = createStyles((theme) => ({
  input: { backgroundColor: theme.colors.dark[7] }
}))

export default function Omnibar() {
  const { classes: { input: inputSx } } = useStyles()
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [allTags, setAllTags] = useState<{ name: string}[]>([])

  const showPreview = useUiStore((state) => state.showPreview)
  const { toggleComments, toggleDescription, togglePreview } = useUiStore((state) => state.actions)


  return (
    <Flex align={'center'} gap={8} >
      <MultiSelect
        classNames={{ input: inputSx }} radius="lg"
        searchable creatable
        label="List of tags:" placeholder="Choose a tag..."
        data={allTags.map(({ name }) => ({ value: name, label: `#${name}` }))}
        value={selectedTags} onChange={setSelectedTags}
        getCreateLabel={(query) => `+ Create tag #${query}`}
        onCreate={(tagName) => { return setAllTags([...allTags, { name: tagName }]), tagName }}
      />

      <Button style={{ marginRight: 10 }} onClick={() => toggleDescription()}>
        Description
      </Button>
      <Button style={{ marginRight: 10 }} onClick={() => toggleComments()}>
        Comments
      </Button>
      <Button style={{ marginRight: 10 }} onClick={() => {
        console.log('show preview:', showPreview)
        togglePreview()
      }}>
        Preview
      </Button>
    </Flex>
  )
}