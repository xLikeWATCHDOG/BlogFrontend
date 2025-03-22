import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { IconDownload, IconEdit, IconTrash } from '@tabler/icons-react';
import useSWR from 'swr';
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Group,
  Image,
  Loader,
  Pagination,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BACKEND_URL } from '@/data/global';

// 整合包状态枚举
enum ModpackStatus {
  WAITING = 0,
  AUDITING = 1,
  PASSED = 2,
  FAILED = 3,
}

// 整合包状态映射
const statusMap = {
  [ModpackStatus.WAITING]: { label: '等待审核', color: 'blue' },
  [ModpackStatus.AUDITING]: { label: '审核中', color: 'yellow' },
  [ModpackStatus.PASSED]: { label: '已通过', color: 'green' },
  [ModpackStatus.FAILED]: { label: '未通过', color: 'red' },
};

// 整合包类型定义
interface Modpack {
  id: number;
  uid: number;
  logoId: number;
  launchArguments: string;
  brief: string;
  client: string;
  version: string;
  filePath: string;
  fileSize: number;
  md5: string;
  status: number;
  reason: string;
  createTime: string;
  updateTime: string;
  logoMd5: string;
}

// 分页响应类型
interface PageResponse {
  records: Modpack[];
  totalPage: number;
  pageSize: number;
  pageNumber: number;
  totalRow: number;
}

// API响应类型
interface ApiResponse {
  code: number;
  message: string;
  data: PageResponse;
}

// 获取整合包列表的fetcher函数
const fetcher = async (url: string) => {
  const loginToken = localStorage.getItem('loginToken');
  
  // 从URL中提取查询参数
  const urlObj = new URL(url);
  const current = urlObj.searchParams.get('current') || '1';
  const pageSize = urlObj.searchParams.get('pageSize') || '10';
  
  // 使用POST请求并发送JSON数据
  const response = await fetch(`${BACKEND_URL}/modpack/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      loginToken: loginToken || '',
    },
    body: JSON.stringify({
      current: parseInt(current),
      pageSize: parseInt(pageSize)
    }),
  });

  if (!response.ok) {
    throw new Error('获取整合包列表失败');
  }

  return response.json();
};

export default function MyModpacksPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 获取整合包列表数据 - 修改URL格式以适应fetcher函数
  const { data, error, mutate } = useSWR<ApiResponse>(
    `${BACKEND_URL}/modpack/list?current=${page}&pageSize=${pageSize}`,
    fetcher
  );

  // 处理删除整合包
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个整合包吗？此操作不可恢复。')) {
      return;
    }

    try {
      const loginToken = localStorage.getItem('loginToken');
      const response = await fetch(`${BACKEND_URL}/modpack/${id}`, {
        method: 'DELETE',
        headers: {
          loginToken: loginToken || '',
        },
      });

      const result = await response.json();

      if (result.code === 20000) {
        notifications.show({
          title: '成功',
          message: '整合包已删除',
          color: 'green',
        });
        mutate(); // 刷新列表
      } else {
        throw new Error(result.message || '删除失败');
      }
    } catch (error) {
      notifications.show({
        title: '错误',
        message: error instanceof Error ? error.message : '操作失败，请稍后重试',
        color: 'red',
      });
    }
  };

  // 处理下载整合包
  const handleDownload = (id: number) => {
    window.open(`${BACKEND_URL}/modpack/download/${id}`, '_blank');
  };

  // 格式化文件大小
  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else if (size < 1024 * 1024 * 1024) {
      return `${(size / 1024 / 1024).toFixed(2)} MB`;
    } else {
      return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
    }
  };

  // 加载中状态
  if (!data && !error) {
    return (
      <Container size="lg" py="xl">
        <Flex justify="center" align="center" h={400}>
          <Loader size="lg" />
        </Flex>
      </Container>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Container size="lg" py="xl">
        <Box ta="center">
          <Title order={3} mb="md" c="red">
            获取数据失败
          </Title>
          <Text>请检查网络连接或重新登录后再试</Text>
          <Button mt="md" onClick={() => router.push('/')}>
            主页
          </Button>
        </Box>
      </Container>
    );
  }

  // 空数据状态
  if (!data?.data?.records || data.data.records.length === 0) {
    return (
      <Container size="lg" py="xl">
        <Box ta="center">
          <Title order={3} mb="md">
            您还没有上传过整合包
          </Title>
          <Button onClick={() => router.push('/modpack/new')}>上传新整合包</Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={2}>我的整合包资源</Title>
        <Button onClick={() => router.push('/modpack/new')}>上传新整合包</Button>
      </Group>

      <Stack gap="md">
        {data?.data.records.map((modpack) => (
          <Card key={modpack.id} withBorder shadow="sm" padding="lg">
            <Group align="flex-start" wrap="nowrap">
              <Image
                src={`${BACKEND_URL}/photo/${modpack.logoMd5}`}
                alt={`整合包 ${modpack.id} 的图标`}
                width={100}
                height={100}
                radius="md"
              />

              <Box style={{ flex: 1 }}>
                <Group justify="space-between" mb="xs">
                  <Title order={4}>{modpack.client}</Title>
                  <Badge color={statusMap[modpack.status as ModpackStatus].color}>
                    {statusMap[modpack.status as ModpackStatus].label}
                  </Badge>
                </Group>

                <Text size="sm" mb="xs">
                  版本: {modpack.version}
                </Text>

                <Text size="sm" mb="xs">
                  大小: {formatFileSize(modpack.fileSize)}
                </Text>

                <Text size="sm" mb="xs" lineClamp={2}>
                  启动参数: {modpack.launchArguments}
                </Text>

                <Text size="sm" lineClamp={2}>
                  简介: {modpack.brief}
                </Text>

                {modpack.status === ModpackStatus.FAILED && (
                  <Text size="sm" c="red" mt="xs">
                    拒绝原因: {modpack.reason || '未提供原因'}
                  </Text>
                )}

                <Group mt="md" gap="xs">
                  {modpack.status === ModpackStatus.PASSED && (
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconDownload size={16} />}
                      onClick={() => handleDownload(modpack.id)}
                    >
                      下载
                    </Button>
                  )}

                  {modpack.status === ModpackStatus.FAILED && (
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconEdit size={16} />}
                      onClick={() => router.push(`/modpack/edit/${modpack.id}`)}
                    >
                      编辑
                    </Button>
                  )}

                  <Button
                    size="xs"
                    variant="light"
                    color="red"
                    leftSection={<IconTrash size={16} />}
                    onClick={() => handleDelete(modpack.id)}
                  >
                    删除
                  </Button>
                </Group>
              </Box>
            </Group>
          </Card>
        ))}
      </Stack>

      {data?.data?.totalPage > 0 && (
        <Box mt="xl" mb={60} py="md">
          <Flex justify="center">
            <Pagination
              total={data.data.totalPage}
              value={page}
              onChange={(newPage) => {
                setPage(newPage);
                window.scrollTo(0, 0);
              }}
              withEdges
              siblings={1}
            />
          </Flex>
          <Text ta="center" size="sm" c="dimmed" mt="xs">
            共 {data.data.totalRow} 条记录，第 {page} / {data.data.totalPage} 页
          </Text>
        </Box>
      )}
    </Container>
  );
}
