import React from 'react';
import { Container, Stack, Title } from '@mantine/core';
import { BlogCardComponent } from '@/components/BlogCard/BlogCardComponent';


export interface Article {
  id: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  imageUrl: string;
  views: number;
  author: string;
}

const recentArticles: Article[] = [
  {
    id: '1',
    title: '使用 Next.js 构建现代博客系统',
    description:
      '本文将介绍如何使用 Next.js 和 Mantine UI 构建一个现代化的博客系统，包括性能优化、SEO 优化等方面...',
    date: '2024-01-20',
    tags: ['Next.js', 'React', '博客开发'],
    imageUrl:
      'https://cdn.shopify.com/s/files/1/0754/2767/6508/files/what_is_a_jpg_file_480x480.jpg?v=1683282723',
    views: 756,
    author: '小明',
  },
  {
    id: '2',
    title: 'Mantine UI 组件库实践指南',
    description: '深入探讨 Mantine UI 组件库的使用技巧，以及如何构建美观的用户界面...',
    date: '2024-01-18',
    tags: ['Mantine', 'UI设计', '前端开发'],
    imageUrl: 'https://via.placeholder.com/300x200',
    views: 543,
    author: '小红',
  },
];

export function Home() {
  return (
    <Container size="lg">
      <Stack mt="xl" p="xl">
        <Title order={2}>最新文章</Title>
        {recentArticles.map((article) => (
          <BlogCardComponent key={article.id} {...article} />
        ))}
      </Stack>
    </Container>
  );
}