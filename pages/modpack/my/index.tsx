import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { IconDownload, IconEdit, IconRefresh, IconTrash, IconChevronDown } from '@tabler/icons-react';
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
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
  Select,
  Collapse,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
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
  name: string;
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
  modpackStatus: string;
  available: number;
}

// API响应类型
interface ApiResponse {
  code: number;
  message: string;
  data: Modpack[];
}

// 分组后的ModPack类型
interface GroupedModpack {
  name: string;
  versions: Modpack[];
  defaultSelectedId: number;
}

// 获取整合包列表的fetcher函数 - 移除分页参数
const fetcher = async (url: string) => {
  const loginToken = localStorage.getItem('loginToken');

  // 使用POST请求获取所有数据，不再使用分页
  const response = await fetch(`${BACKEND_URL}/modpack/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      loginToken: loginToken || '',
    },
    body: JSON.stringify({
      current: 1,
      pageSize: 1000 // 设置一个较大的值来获取所有数据
    }),
  });

  if (!response.ok) {
    throw new Error('获取整合包列表失败');
  }

  return response.json();
};

export default function MyModpacksPage() {
  const router = useRouter();
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [selectedModpackId, setSelectedModpackId] = useState<number | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  // 新增：管理每个分组的选中版本
  const [selectedVersions, setSelectedVersions] = useState<Record<string, number>>({});

  // 获取整合包列表数据 - 移除分页参数
  const { data, error, mutate } = useSWR<ApiResponse>(
    `${BACKEND_URL}/modpack/list`,
    fetcher
  );

  // 按名称分组ModPack
  const groupedModpacks: GroupedModpack[] = useMemo(() => {
    if (!data?.data) return [];
    
    const groups = new Map<string, Modpack[]>();
    
    // 按名称分组
    data.data.forEach(modpack => {
      const name = modpack.name;
      if (!groups.has(name)) {
        groups.set(name, []);
      }
      groups.get(name)!.push(modpack);
    });
    
    // 转换为GroupedModpack格式，并按创建时间排序版本
    return Array.from(groups.entries()).map(([name, versions]) => {
      const sortedVersions = versions.sort((a, b) => 
        new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      );
      
      return {
        name,
        versions: sortedVersions,
        defaultSelectedId: sortedVersions[0].id // 默认选择最新版本的ID
      };
    });
  }, [data]);

  // 获取当前选中的版本
  const getSelectedVersion = (group: GroupedModpack): Modpack => {
    const selectedId = selectedVersions[group.name] || group.defaultSelectedId;
    return group.versions.find(v => v.id === selectedId) || group.versions[0];
  };

  // 切换分组展开状态
  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  // 更新选中的版本
  const updateSelectedVersion = (groupName: string, versionId: number) => {
    setSelectedVersions(prev => ({
      ...prev,
      [groupName]: versionId
    }));
  };

  // 打开删除确认对话框
  const openDeleteConfirmation = (id: number) => {
    setSelectedModpackId(id);
    setDeleteReason('');
    openDeleteModal();
  };

  const handleDelete = async () => {
    if (!selectedModpackId) return;

    try {
      const loginToken = localStorage.getItem('loginToken');
      const response = await fetch(`${BACKEND_URL}/modpack/${selectedModpackId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          loginToken: loginToken || '',
        },
        body: JSON.stringify({
          reason: deleteReason.trim() || '用户未提供删除原因'
        }),
      });

      const result = await response.json();

      if (result.code === 20000) {
        notifications.show({
          title: '成功',
          message: '整合包已删除',
          color: 'green',
        });
        closeDeleteModal();
        mutate();
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

  const handleDownload = (id: number) => {
    window.open(`${BACKEND_URL}/modpack/download/${id}`, '_blank');
  };

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
  if (!data?.data || data.data.length === 0) {
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
        {groupedModpacks.map((group) => {
          const isExpanded = expandedGroups.has(group.name);
          const displayModpack = getSelectedVersion(group);
          
          return (
            <Card key={group.name} withBorder shadow="sm" padding="lg">
              <Group align="flex-start" wrap="nowrap">
                <Image
                  src={`${BACKEND_URL}/photo/${displayModpack.logoMd5}`}
                  alt={`整合包 ${displayModpack.name} 的图标`}
                  width={100}
                  height={100}
                  radius="md"
                />

                <Box style={{ flex: 1 }}>
                  <Group justify="space-between" mb="xs">
                    <Title order={4}>{group.name}</Title>
                    <Group gap="xs">
                      <Badge color={statusMap[displayModpack.status as ModpackStatus].color}>
                        {statusMap[displayModpack.status as ModpackStatus].label}
                      </Badge>
                      {group.versions.length > 1 && (
                        <Badge variant="light" color="blue">
                          {group.versions.length} 个版本
                        </Badge>
                      )}
                    </Group>
                  </Group>

                  {/* 版本选择器 */}
                  {group.versions.length > 1 && (
                    <Group mb="xs">
                      <Text size="sm" fw={500}>版本:</Text>
                      <Select
                        size="xs"
                        value={displayModpack.id.toString()}
                        data={group.versions.map(v => ({
                          value: v.id.toString(),
                          label: `${v.version} (${new Date(v.createTime).toLocaleDateString()})`
                        }))}
                        onChange={(value) => {
                          if (value) {
                            const versionId = parseInt(value);
                            updateSelectedVersion(group.name, versionId);
                          }
                        }}
                        style={{ minWidth: 200 }}
                      />
                    </Group>
                  )}

                  <Text size="sm" mb="xs">
                    当前版本: {displayModpack.version}
                  </Text>

                  <Text size="sm" mb="xs">
                    大小: {formatFileSize(displayModpack.fileSize)}
                  </Text>

                  <Text size="sm" mb="xs" lineClamp={2}>
                    启动参数: {displayModpack.launchArguments}
                  </Text>

                  <Text size="sm" lineClamp={2}>
                    简介: {displayModpack.brief}
                  </Text>

                  {displayModpack.status === ModpackStatus.FAILED && (
                    <Text size="sm" c="red" mt="xs">
                      拒绝原因: {displayModpack.reason || '未提供原因'}
                    </Text>
                  )}

                  <Group mt="md" gap="xs">
                    {displayModpack.status === ModpackStatus.PASSED && (
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconDownload size={16} />}
                        onClick={() => handleDownload(displayModpack.id)}
                      >
                        下载
                      </Button>
                    )}

                    {displayModpack.status === ModpackStatus.FAILED && (
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconEdit size={16} />}
                        onClick={() => router.push(`/modpack/edit/${displayModpack.id}`)}
                      >
                        编辑
                      </Button>
                    )}

                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconRefresh size={16} />}
                      onClick={() => router.push(`/modpack/new?id=${displayModpack.id}&type=update`)}
                    >
                      更新
                    </Button>

                    <Button
                      size="xs"
                      variant="light"
                      color="blue"
                      leftSection={<IconEdit size={16} />}
                      onClick={() => router.push(`/modpack/new?id=${displayModpack.id}&type=edit`)}
                    >
                      编辑
                    </Button>

                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      leftSection={<IconTrash size={16} />}
                      onClick={() => openDeleteConfirmation(displayModpack.id)}
                    >
                      删除
                    </Button>

                    {group.versions.length > 1 && (
                      <Button
                        size="xs"
                        variant="subtle"
                        leftSection={<IconChevronDown size={16} style={{ 
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }} />}
                        onClick={() => toggleGroup(group.name)}
                      >
                        {isExpanded ? '收起' : '查看所有版本'}
                      </Button>
                    )}
                  </Group>

                  {/* 展开的版本列表 */}
                  <Collapse in={isExpanded}>
                    <Box mt="md" p="md" bg="gray.0" style={{ borderRadius: 8 }}>
                      <Text size="sm" fw={500} mb="xs">所有版本:</Text>
                      <Stack gap="xs">
                        {group.versions.map((version) => (
                          // Line 429 - Current correct implementation
                          <Group key={version.id} justify="space-between" p="xs" bg="white" style={{ borderRadius: '0.25rem' }}>
                            <Group gap="xs">
                              <Text size="sm">{version.version}</Text>
                              <Badge size="xs" color={statusMap[version.status as ModpackStatus].color}>
                                {statusMap[version.status as ModpackStatus].label}
                              </Badge>
                              <Text size="xs" c="dimmed">
                                {new Date(version.createTime).toLocaleString()}
                              </Text>
                            </Group>
                            <Group gap="xs">
                              {version.status === ModpackStatus.PASSED && (
                                <Button
                                  size="xs"
                                  variant="light"
                                  onClick={() => handleDownload(version.id)}
                                >
                                  下载
                                </Button>
                              )}
                              <Button
                                size="xs"
                                variant="light"
                                color="red"
                                onClick={() => openDeleteConfirmation(version.id)}
                              >
                                删除
                              </Button>
                            </Group>
                          </Group>
                        ))}
                      </Stack>
                    </Box>
                  </Collapse>
                </Box>
              </Group>
            </Card>
          );
        })}
      </Stack>

      {/* 删除确认对话框 */}
      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="确认删除" centered>
        <Text mb="md">您确定要删除这个整合包吗？此操作不可恢复。</Text>
        <TextInput
          label="删除原因"
          placeholder="请输入删除原因（可选）"
          value={deleteReason}
          onChange={(e) => setDeleteReason(e.target.value)}
          mb="lg"
        />
        <Group justify="center">
          <Button variant="outline" onClick={closeDeleteModal}>
            取消
          </Button>
          <Button color="red" onClick={handleDelete}>
            确认删除
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
