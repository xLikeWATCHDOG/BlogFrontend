import React from 'react';
import { Badge, Card, Group, Image, Stack, Text, Title } from '@mantine/core';


interface BlogCardProps {
  id: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  imageUrl: string;
  views: number;
  author: string; // 新增作者字段
}

export function BlogCardComponent({
  title,
  description,
  date,
  tags,
  imageUrl,
  views,
  author,
}: BlogCardProps) {
  return (
    <Card shadow="sm" padding="md" withBorder radius="lg">
      <Card.Section>
        <Image src={imageUrl} height={200} alt={title} radius="lg" />
      </Card.Section>

      <Stack mt="md" m="xs">
        <Group justify="space-between" align="center">
          <Title order={3}>{title}</Title>
          <Text size="sm" c="dimmed">
            👁 {views}
          </Text>
        </Group>

        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            作者：{author}
          </Text>
          <Text size="sm" c="dimmed">
            {date}
          </Text>
        </Group>

        <Group gap="xs">
          {tags.map((tag) => (
            <Badge key={tag} variant="light">
              {tag}
            </Badge>
          ))}
        </Group>

        <Text lineClamp={2}>{description}</Text>
      </Stack>
    </Card>
  );
}
