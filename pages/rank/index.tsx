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
    title: '2023年前端技术趋势分析',
    description: '回顾2023年前端领域的重要技术发展，展望未来趋势...',
    date: '2024-01-10',
    tags: ['前端', '技术趋势', '年度总结'],
    imageUrl: 'https://via.placeholder.com/300x200',
    views: 5678,
    author: '王五',
  },
  {
    id: '2',
    title: 'Next.js 14 新特性解析',
    description: '详细介绍 Next.js 14 带来的重要更新和改进...',
    date: '2024-01-08',
    tags: ['Next.js', 'React', '前端框架'],
    imageUrl: 'https://via.placeholder.com/300x200',
    views: 4321,
    author: '赵六',
  },
];

export default function RankPage() {
  return (
    <Container size="lg" mt="xl">
      <Stack p="xl" mt="xl">
        <Title order={2}>文章排行榜</Title>

        {mockArticles.map((article) => (
          <BlogCardComponent key={article.id} {...article} />
        ))}
      </Stack>
    </Container>
  );
}