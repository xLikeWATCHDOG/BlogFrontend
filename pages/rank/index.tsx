import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Group, Pagination, Skeleton, Stack, Text, Title } from '@mantine/core';
import { BlogCardComponent } from '@/components/BlogCard/BlogCardComponent';
import { BACKEND_URL } from '@/data/global';


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

// 后端返回的文章数据接口
interface BlogArticle {
  id: number;
  title: string;
  description: string;
  createTime: string;
  tags: string[];
  views: number;
  image: string;
  author: string;
}

export default function Hot() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(() => {
    // 从URL获取初始页码
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const page = parseInt(urlParams.get('page') || '1', 10);
      return page > 0 ? page : 1;
    }
    return 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const pageSize = 5; // 每页显示5篇文章

  // 从URL获取当前页码
  useEffect(() => {
    if (router.isReady && router.query.page) {
      const pageNum = parseInt(router.query.page as string, 10);
      if (!isNaN(pageNum) && pageNum > 0 && pageNum !== currentPage) {
        setCurrentPage(pageNum);
      }
    }
  }, [router.isReady, router.query.page]);

  useEffect(() => {
    // 获取博客列表
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${BACKEND_URL}/blog/rank?current=${currentPage}&pageSize=${pageSize}`
        );

        if (!response.ok) {
          throw new Error('获取文章列表失败');
        }

        const data = await response.json();

        if (data.code === 20000 && data.data) {
          // 转换后端数据格式为前端所需格式
          const formattedArticles = data.data.records.map((article: BlogArticle) => ({
            id: article.id.toString(),
            title: article.title,
            description: article.description,
            date: article.createTime,
            tags: article.tags,
            imageUrl: article.image.startsWith('http')
              ? article.image
              : `${BACKEND_URL}/photo/${article.image}`,
            views: article.views,
            author: article.author,
          }));

          setArticles(formattedArticles);
          setTotalPages(data.data.totalPage);
          setTotalArticles(data.data.totalRow);
        }
      } catch (error) {
        console.error('获取文章列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [currentPage]); // 添加currentPage作为依赖项，当页码变化时重新获取数据

  // 处理页码变化
  const handlePageChange = (page: number) => {
    // 更新路由中的页码
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, page },
      },
      undefined,
      { shallow: true }
    );

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 页面切换时滚动到顶部
  };

  return (
    <Container size="lg" mt="xl" pb={80}>
      <Stack mt="xl" p="xl">
        <Title order={2}>文章排行</Title>

        {loading ? (
          // 加载状态显示骨架屏
          <>
            <Skeleton height={200} radius="md" mb="md" />
            <Skeleton height={200} radius="md" mb="md" />
            <Skeleton height={200} radius="md" mb="md" />
          </>
        ) : (
          // 显示文章列表
          <>
            {articles.map((article) => (
              <BlogCardComponent key={article.id} {...article} />
            ))}

            {/* 分页控件 */}
            {totalPages > 1 && (
              <Group justify="center" mt="xl">
                <Stack align="center" gap="xs">
                  <Pagination
                    total={totalPages}
                    value={currentPage}
                    onChange={handlePageChange}
                    radius="md"
                    withEdges
                  />
                  <Text size="sm" c="dimmed">
                    共 {totalPages} 页，{totalArticles} 篇文章
                  </Text>
                </Stack>
              </Group>
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}