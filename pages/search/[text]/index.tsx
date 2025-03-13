import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Paper, Stack, Text, Title } from '@mantine/core';

export default function SearchResultPage() {
  const router = useRouter();
  const { text } = router.query;
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    if (text) {
      setSearchValue(text as string);
    }
  }, [text]);

  return (
    <Container size="lg" mt="xl">
      <Stack p="xl">
        <Title order={2}>搜索 " {text} " 的结果</Title>
        <Paper shadow="sm" p="md" withBorder>
          <Text>暂无搜索结果</Text>
        </Paper>
      </Stack>
    </Container>
  );
}
