import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IconDownload, IconServer, IconUser } from '@tabler/icons-react';
import {
  Button,
  Center,
  Container,
  Group,
  Image,
  LoadingOverlay,
  Pagination,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { DownloadModal } from '@/components/DownloadModal/DownloadModal';

interface Content {
  name: string;
  size: number;
  is_dir: boolean;
  created: string;
  modified: string;
  hash_info?: string;
  hashinfo?: string;
  type: number;
  thumb: string;
  sign: string;
  brief?: string; // 添加简介字段
}
export default function ModPackPage() {
  const router = useRouter();
  const [packs, setPacks] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const [downloadPack, setDownloadPack] = useState<string>('');

  // 添加路由就绪检查
  useEffect(() => {
    if (!router.isReady) return;

    // 只初始化页码
    const pageFromUrl = Number(router.query.page);
    setCurrentPage(pageFromUrl > 0 ? pageFromUrl : 1);
  }, [router.isReady, router.query]);

  // 处理页码变化
  const handlePageChange = (page: number) => {
    let validPage = page;
    if (page <= 0 || page > totalPages || !Number.isInteger(page)) {
      validPage = 1;
    }
    setCurrentPage(validPage);
    router.push({
      pathname: router.pathname,
      query: { page: validPage },
    });
  };

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const response = await fetch('https://data.elfidc.com/api/fs/list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: '/Minecraft/整合包',
            page: currentPage,
            per_page: itemsPerPage,
          }),
        });

        const data = await response.json();
        if (data && data.data && Array.isArray(data.data.content)) {
          const dirPacks = data.data.content.filter((item: Content) => item.is_dir);
          const packsWithBrief = await Promise.all(
            dirPacks.map(async (pack: Content) => ({
              ...pack,
              brief: await fetch(
                `https://data.elfidc.com/p/Minecraft/整合包/${pack.name}/${pack.name}-brief.txt`
              )
                .then((res) => res.text())
                .catch(() => '暂无简介'),
            }))
          );

          setPacks(packsWithBrief);
          setTotalItems(data.data.total);
        } else {
          console.error('Invalid response format:', data);
          setPacks([]);
        }
      } catch (error) {
        console.error('获取整合包列表失败:', error);
        setPacks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPacks();
  }, [currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  return (
    <Container size="lg" py="xl" pos="relative">
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ blur: 2 }} />

      <Stack gap="xl">
        <Stack gap="md">
          {packs.map((pack) => (
            <Paper key={pack.name} shadow="sm" p="md" withBorder radius="lg">
              <Group wrap="nowrap" gap="xl">
                <Image
                  src={`https://data.elfidc.com/p/Minecraft/整合包/${pack.name}/${pack.name}-logo.png`}
                  h={120}
                  w={120}
                  radius="md"
                />

                <Stack style={{ flex: 1 }} gap="xs">
                  <Group justify="space-between" align="center">
                    <Title order={3}>{pack.name}</Title>
                  </Group>

                  {pack.brief && (
                    <Text size="sm" lineClamp={2}>
                      {pack.brief}
                    </Text>
                  )}

                  <Stack gap={4}>
                    <Text size="sm" c="dimmed">
                      创建时间: {new Date(pack.created).toLocaleString()}
                    </Text>
                    <Text size="sm" c="dimmed">
                      修改时间: {new Date(pack.modified).toLocaleString()}
                    </Text>
                  </Stack>

                  <Group justify="flex-end" align="center" gap="sm">
                    <Button
                      variant="light"
                      leftSection={<IconServer size={16} />}
                      onClick={() => window.open('https://www.elfidc.com/minecraft.html')}
                    >
                      一键联机
                    </Button>
                    <Button
                      variant="light"
                      leftSection={<IconUser size={16} />}
                      onClick={async () => {
                        const content = await fetch(
                          `https://data.elfidc.com/p/Minecraft/整合包/${pack.name}/${pack.name}-client.txt`
                        )
                          .then((res) => res.text())
                          .catch(() => '暂无作者连接');
                        window.open(content.toString());
                      }}
                    >
                      作者
                    </Button>
                    <Button
                      variant="light"
                      leftSection={<IconDownload size={16} />}
                      onClick={() => setDownloadPack(pack.name)}
                    >
                      下载
                    </Button>
                  </Group>
                </Stack>
              </Group>
            </Paper>
          ))}
        </Stack>

        {/* 添加下载模态框 */}
        <DownloadModal
          packName={downloadPack}
          opened={!!downloadPack}
          onClose={() => setDownloadPack('')}
        />

        <Center mb="xl">
          <Group>
            <Pagination
              total={totalPages}
              value={currentPage}
              onChange={handlePageChange}
              radius="md"
            />
            <Text size="sm" c="dimmed">
              共 {totalPages} 页，{totalItems} 个整合包
            </Text>
          </Group>
        </Center>
      </Stack>
    </Container>
  );
}
