import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IconDownload, IconSearch, IconServer, IconUser } from '@tabler/icons-react';
import {
  Button,
  Center,
  Container,
  Divider,
  Group,
  Image,
  LoadingOverlay,
  Pagination,
  Paper,
  Stack,
  Text,
  TextInput,
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
  brief?: string;
  parent?: string; // 搜索结果中的路径字段
}

export default function ModPackPage() {
  const router = useRouter();
  const [packs, setPacks] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const [downloadPack, setDownloadPack] = useState<string>('');
  const [searchValue, setSearchValue] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);

  // 添加路由就绪检查
  useEffect(() => {
    if (!router.isReady) return;

    // 初始化页码和搜索值
    const pageFromUrl = Number(router.query.page);
    const searchFromUrl = (router.query.search as string) || '';
    setCurrentPage(pageFromUrl > 0 ? pageFromUrl : 1);
    setSearchValue(searchFromUrl);
    setIsSearching(!!searchFromUrl);
  }, [router.isReady, router.query]);

  // 处理页码变化
  const handlePageChange = (page: number) => {
    let validPage = page;
    if (page <= 0 || page > totalPages || !Number.isInteger(page)) {
      validPage = 1;
    }
    setCurrentPage(validPage);

    const query: any = { page: validPage };
    if (searchValue) {
      query.search = searchValue;
    }

    router.push({
      pathname: router.pathname,
      query,
    });
  };

  // 搜索API调用函数 - 基于提供的curl请求格式
  const searchPacks = async (keywords: string, page: number) => {
    try {
      const response = await fetch('https://data.elfidc.com/api/fs/search', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          parent: '/Minecraft/整合包',
          keywords: keywords,
          scope: 1, // 1-文件夹（整合包都是文件夹）
          page: page,
          per_page: itemsPerPage,
          password: '',
        }),
      });

      const data = await response.json();
      console.log('搜索API响应:', data); // 添加调试日志

      if (data && data.code === 200 && data.data && Array.isArray(data.data.content)) {
        // 过滤出文件夹类型的整合包
        const dirPacks = data.data.content.filter((item: Content) => item.is_dir);

        // 获取每个整合包的简介
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
        console.error('搜索失败:', data);
        setPacks([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('搜索请求失败:', error);
      setPacks([]);
      setTotalItems(0);
    }
  };

  // 获取整合包列表
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
    }
  };

  // 根据搜索状态决定调用哪个API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (isSearching && searchValue.trim()) {
          await searchPacks(searchValue.trim(), currentPage);
        } else {
          await fetchPacks();
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentPage, isSearching, searchValue]);

  // 处理搜索输入变化 - 添加防抖
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    setSearchValue(value);

    // 清除之前的定时器
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // 设置新的定时器，500ms后执行搜索
    const newTimeout = setTimeout(() => {
      setCurrentPage(1);

      if (value.trim()) {
        console.log('开始搜索:', value.trim()); // 添加调试日志
        setIsSearching(true);
        router.replace({
          pathname: router.pathname,
          query: { search: value.trim(), page: 1 },
        });
      } else {
        console.log('清除搜索'); // 添加调试日志
        setIsSearching(false);
        const { search, ...queryWithoutSearch } = router.query;
        router.replace({
          pathname: router.pathname,
          query: { page: 1 },
        });
      }
    }, 500);

    setSearchTimeout(newTimeout);
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  return (
    <Container size="lg" py="xl" pos="relative">
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ blur: 2 }} />

      <Stack gap="xl">
        {/* 搜索框 */}
        <Paper shadow="sm" p="md" withBorder radius="lg">
          <TextInput
            leftSection={<IconSearch size={16} />}
            placeholder="请输入整合包关键词进行搜索"
            value={searchValue}
            onChange={handleSearchChange}
            size="md"
          />
          {isSearching && (
            <Text size="sm" c="dimmed" mt="xs">
              搜索 "{searchValue}" 的结果: {totalItems} 个整合包
            </Text>
          )}
        </Paper>

        <Divider />

        <Stack gap="md">
          {packs.length === 0 && !loading ? (
            <Paper p="xl" withBorder radius="lg">
              <Center>
                <Stack align="center" gap="md">
                  <IconSearch size={48} color="gray" />
                  <Text size="lg" c="dimmed">
                    {isSearching ? `未找到包含 "${searchValue}" 的整合包` : '暂无整合包'}
                  </Text>
                  {isSearching && (
                    <Button
                      variant="light"
                      onClick={() => {
                        setSearchValue('');
                        setIsSearching(false);
                        router.replace({ pathname: router.pathname, query: { page: 1 } });
                      }}
                    >
                      查看全部整合包
                    </Button>
                  )}
                </Stack>
              </Center>
            </Paper>
          ) : (
            packs.map((pack) => (
              <Paper key={pack.name} shadow="sm" p="md" withBorder radius="lg">
                <Group wrap="wrap" gap="xl" align="flex-start">
                  <Image
                    src={`https://data.elfidc.com/p/Minecraft/整合包/${pack.name}/${pack.name}-logo.png`}
                    h={120}
                    w={120}
                    radius="md"
                    style={{ minWidth: 120 }}
                  />

                  <Stack style={{ flex: 1, minWidth: '250px' }} gap="xs">
                    <Group justify="space-between" align="center" wrap="wrap">
                      <Title order={3} style={{ wordBreak: 'break-word' }}>
                        {pack.name}
                      </Title>
                    </Group>

                    {pack.brief && (
                      <Text size="sm" lineClamp={2}>
                        {pack.brief}
                      </Text>
                    )}

                    <Stack gap={4}>
                      {pack.parent && isSearching && (
                        <Text size="sm" c="dimmed">
                          路径: {pack.parent}
                        </Text>
                      )}
                      <Text size="sm" c="dimmed">
                        创建时间: {new Date(pack.created).toLocaleString()}
                      </Text>
                      <Text size="sm" c="dimmed">
                        修改时间: {new Date(pack.modified).toLocaleString()}
                      </Text>
                    </Stack>

                    <Group justify="flex-end" align="center" gap="sm" wrap="wrap">
                      <Button
                        variant="light"
                        leftSection={<IconServer size={16} />}
                        onClick={() => window.open('https://www.elfidc.com/minecraft.html')}
                        size="sm"
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
                        size="sm"
                      >
                        作者
                      </Button>
                      <Button
                        variant="light"
                        leftSection={<IconDownload size={16} />}
                        onClick={() => setDownloadPack(pack.name)}
                        size="sm"
                      >
                        下载
                      </Button>
                    </Group>
                  </Stack>
                </Group>
              </Paper>
            ))
          )}
        </Stack>

        {/* 下载模态框 */}
        <DownloadModal
          packName={downloadPack}
          opened={!!downloadPack}
          onClose={() => setDownloadPack('')}
        />

        {totalPages > 1 && (
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
        )}
      </Stack>
    </Container>
  );
}
