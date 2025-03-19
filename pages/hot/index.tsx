import React from 'react';
import { Container, Stack, Title } from '@mantine/core';
import { BlogCardComponent } from '@/components/BlogCard/BlogCardComponent';

interface Article {
  id: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  imageUrl: string;
  views: number;
  author: string;
}

const mockArticles: Article[] = [
  {
    id: '1',
    title: '如何优化 React 应用性能',
    description: '本文将介绍一些实用的 React 性能优化技巧，包括状态管理、组件拆分等方面...',
    date: '2024-01-15',
    tags: ['React', '性能优化', '前端开发'],
    imageUrl: 'https://via.placeholder.com/300x200',
    views: 1234,
    author: '张三',
  },
  {
    id: '2',
    title: 'TypeScript 高级特性详解',
    description: '深入探讨 TypeScript 的高级类型、泛型和装饰器等特性的使用方法...',
    date: '2024-01-14',
    tags: ['TypeScript', '前端开发'],
    imageUrl: 'https://via.placeholder.com/300x200',
    views: 986,
    author: '李四',
  },
];

export default function HotPage() {
  return (
    <Container size="lg" mt="xl">
      <Stack p="xl" mt="xl">
        <Title order={2}>热门文章</Title>

        {mockArticles.map((article) => (
          <BlogCardComponent key={article.id} {...article} />
        ))}
      </Stack>
    </Container>
  );
}
