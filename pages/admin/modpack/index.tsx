import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IconAlertCircle, IconCheck, IconEdit, IconEye, IconSearch, IconTrash, IconX } from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Group,
  Image,
  Input,
  Loader,
  Modal,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
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
  logoMd5?: string;
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

// 查询参数类型
interface QueryParams {
  current: number;
  pageSize: number;
  uid?: number;
  status?: number;
  admin: boolean;
}

export default function ModpackAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modpacks, setModpacks] = useState<Modpack[]>([]);
  const [pageData, setPageData] = useState<PageResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedModpack, setSelectedModpack] = useState<Modpack | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [statusOpened, { open: openStatus, close: closeStatus }] = useDisclosure(false);
  const [newStatus, setNewStatus] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // 查询参数
  const [queryParams, setQueryParams] = useState<QueryParams>({
    current: 1,
    pageSize: 10,
    admin: true
  });

  // 检查管理员权限
  useEffect(() => {
    const checkAdminPermission = async () => {
      try {
        const loginToken = localStorage.getItem('loginToken');
        if (!loginToken) {
          notifications.show({
            title: '需要登录',
            message: '请先登录后再访问管理页面',
            color: 'red',
          });
          router.push('/login');
          return;
        }

        const response = await fetch(`${BACKEND_URL}/user/token`, {
          method: 'POST',
          headers: {
            loginToken,
          },
        });

        if (!response.ok) {
          throw new Error('获取用户信息失败');
        }

        const data = await response.json();
        if (data.code !== 20000 || !data.data) {
          throw new Error(data.message || '获取用户信息失败');
        }

        const userInfo = data.data;
        const hasAdminRole =
          userInfo.group.permission === '*' || userInfo.group.permission?.includes('admin');

        if (!hasAdminRole) {
          notifications.show({
            title: '权限不足',
            message: '您没有管理员权限',
            color: 'red',
          });
          router.push('/');
          return;
        }

        setIsAdmin(true);
        fetchModpacks(queryParams);
      } catch (error) {
        console.error('权限检查失败:', error);
        notifications.show({
          title: '权限检查失败',
          message: error instanceof Error ? error.message : '未知错误',
          color: 'red',
        });
        router.push('/');
      }
    };

    checkAdminPermission();
  }, [router]);

  // 获取整合包列表
  const fetchModpacks = async (params: QueryParams) => {
    setLoading(true);
    try {
      const loginToken = localStorage.getItem('loginToken');
      const response = await fetch(`${BACKEND_URL}/modpack/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          loginToken: loginToken || '',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('获取整合包列表失败');
      }

      const data = await response.json();
      if (data.code !== 20000) {
        throw new Error(data.message || '获取整合包列表失败');
      }

      setModpacks(data.data.records || []);
      setPageData(data.data);
      setCurrentPage(data.data.current || params.current);
    } catch (err) {
      console.error('获取整合包列表失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 处理页码变化
  const handlePageChange = (page: number) => {
    const newParams = { ...queryParams, current: page };
    setQueryParams(newParams);
    fetchModpacks(newParams);
  };

  // 处理查询参数变化
  const handleQueryChange = (key: keyof QueryParams, value: any) => {
    if (value === '' || value === null) {
      const newParams = { ...queryParams };
      delete newParams[key];
      newParams.current = 1;
      setQueryParams(newParams);
    } else {
      setQueryParams({ ...queryParams, [key]: value, current: 1 });
    }
  };

  // 执行查询
  const handleSearch = () => {
    fetchModpacks(queryParams);
  };

  // 重置查询
  const handleReset = () => {
    const newParams = {
      current: 1,
      pageSize: pageSize,
      admin: true
    };
    setQueryParams(newParams);
    fetchModpacks(newParams);
  };

  // 查看整合包详情
  const viewModpackDetail = (modpack: Modpack) => {
    setSelectedModpack(modpack);
    open();
  };

  // 删除整合包
  const handleDelete = async () => {
    if (!selectedModpack) return;

    try {
      const loginToken = localStorage.getItem('loginToken');
      const response = await fetch(`${BACKEND_URL}/modpack/${selectedModpack.id}`, {
        method: 'DELETE',
        headers: {
          loginToken: loginToken || '',
        },
      });

      if (!response.ok) {
        throw new Error('删除整合包失败');
      }

      const data = await response.json();
      if (data.code !== 20000) {
        throw new Error(data.message || '删除整合包失败');
      }

      notifications.show({
        title: '成功',
        message: '整合包已删除',
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      closeDelete();
      close();
      fetchModpacks(queryParams);
    } catch (err) {
      console.error('删除整合包失败:', err);
      notifications.show({
        title: '失败',
        message: err instanceof Error ? err.message : '未知错误',
        color: 'red',
        icon: <IconX size={16} />,
      });
    }
  };

  // 更新整合包状态
  const handleUpdateStatus = async () => {
    if (!selectedModpack || newStatus === null) return;

    try {
      const loginToken = localStorage.getItem('loginToken');
      const response = await fetch(`${BACKEND_URL}/modpack/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          loginToken: loginToken || '',
        },
        body: JSON.stringify({
          id: selectedModpack.id,
          status: newStatus,
          reason: newStatus === ModpackStatus.FAILED ? rejectReason : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('更新整合包状态失败');
      }

      const data = await response.json();
      if (data.code !== 20000) {
        throw new Error(data.message || '更新整合包状态失败');
      }

      notifications.show({
        title: '成功',
        message: '整合包状态已更新',
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      closeStatus();
      close();
      fetchModpacks(queryParams);
    } catch (err) {
      console.error('更新整合包状态失败:', err);
      notifications.show({
        title: '失败',
        message: err instanceof Error ? err.message : '未知错误',
        color: 'red',
        icon: <IconX size={16} />,
      });
    }
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
  if (loading && !modpacks.length) {
    return (
      <Container size="lg" py="xl">
        <Box
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '60vh',
          }}
        >
          <Loader size="lg" />
        </Box>
      </Container>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Container size="lg" py="xl">
        <Paper withBorder p="md" radius="md">
          <Group>
            <IconAlertCircle color="red" size={24} />
            <Text fw={500} size="lg">
              获取数据失败
            </Text>
          </Group>
          <Text mt="sm">{error}</Text>
          <Button mt="md" onClick={() => router.push('/')}>
            返回首页
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="xl">
        整合包管理
      </Title>

      {/* 查询表单 */}
      <Paper withBorder p="md" radius="md" mb="xl">
        <Group align="flex-end" mb="md">
          <TextInput
            label="用户ID"
            placeholder="输入UID"
            value={queryParams.uid || ''}
            onChange={(e) => {
              const value = e.target.value;
              handleQueryChange('uid', value ? parseInt(value) : '');
            }}
          />
          <Select
            label="状态"
            placeholder="选择状态"
            value={queryParams.status?.toString() || ''}
            onChange={(value) => handleQueryChange('status', value ? parseInt(value) : '')}
            data={[
              { value: '', label: '全部' },
              { value: '0', label: '等待审核' },
              { value: '1', label: '审核中' },
              { value: '2', label: '已通过' },
              { value: '3', label: '未通过' },
            ]}
          />
        </Group>
        <Group justify="flex-end">
          <Button variant="outline" onClick={handleReset}>
            重置
          </Button>
          <Button leftSection={<IconSearch size={14} />} onClick={handleSearch}>
            查询
          </Button>
        </Group>
      </Paper>

      {/* 整合包列表 */}
      {modpacks.length === 0 ? (
        <Paper withBorder p="xl" radius="md" ta="center">
          <Text size="lg" fw={500} mb="md">
            暂无整合包数据
          </Text>
          <Text c="dimmed">没有找到符合条件的整合包</Text>
        </Paper>
      ) : (
        <>
          <Paper withBorder radius="md" mb="xl">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>用户ID</Table.Th>
                  <Table.Th>名称</Table.Th>
                  <Table.Th>版本</Table.Th>
                  <Table.Th>大小</Table.Th>
                  <Table.Th>状态</Table.Th>
                  <Table.Th>创建时间</Table.Th>
                  <Table.Th>操作</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {modpacks.map((modpack) => (
                  <Table.Tr key={modpack.id}>
                    <Table.Td>{modpack.id}</Table.Td>
                    <Table.Td>{modpack.uid}</Table.Td>
                    <Table.Td>{modpack.client}</Table.Td>
                    <Table.Td>{modpack.version}</Table.Td>
                    <Table.Td>{formatFileSize(modpack.fileSize)}</Table.Td>
                    <Table.Td>
                      <Badge color={statusMap[modpack.status as ModpackStatus]?.color || 'gray'}>
                        {statusMap[modpack.status as ModpackStatus]?.label || '未知状态'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{new Date(modpack.createTime).toLocaleString('zh-CN')}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          color="blue"
                          onClick={() => viewModpackDetail(modpack)}
                          title="查看详情"
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                        <ActionIcon
                          color="red"
                          onClick={() => {
                            setSelectedModpack(modpack);
                            openDelete();
                          }}
                          title="删除"
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                        <ActionIcon
                          color="green"
                          onClick={() => {
                            setSelectedModpack(modpack);
                            setNewStatus(null);
                            setRejectReason('');
                            openStatus();
                          }}
                          title="修改状态"
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>

          {/* 分页控件 */}
          {pageData && pageData.totalPage > 0 && (
            <Group justify="center" mt="xl">
              <Stack align="center" gap="xs">
                <Pagination
                  total={pageData.totalPage}
                  value={currentPage}
                  onChange={handlePageChange}
                  radius="md"
                  withEdges
                />
                <Text size="sm" c="dimmed">
                  共 {pageData.totalPage} 页，{pageData.totalRow} 条记录
                </Text>
              </Stack>
            </Group>
          )}
        </>
      )}

      {/* 整合包详情模态框 */}
      <Modal opened={opened} onClose={close} title="整合包详情" centered size="lg">
        {selectedModpack && (
          <Box>
            <Group mb="md">
              <Text fw={700}>整合包ID:</Text>
              <Text>{selectedModpack.id}</Text>
            </Group>
            <Group mb="md">
              <Text fw={700}>用户ID:</Text>
              <Text>{selectedModpack.uid}</Text>
              <Button 
                size="xs" 
                variant="subtle" 
                onClick={() => {
                  close();
                  router.push(`/profile/${selectedModpack.uid}`);
                }}
              >
                查看用户
              </Button>
            </Group>
            <Group mb="md">
              <Text fw={700}>整合包名称:</Text>
              <Text>{selectedModpack.client}</Text>
            </Group>
            <Group mb="md">
              <Text fw={700}>版本:</Text>
              <Text>{selectedModpack.version}</Text>
            </Group>
            <Group mb="md">
              <Text fw={700}>文件大小:</Text>
              <Text>{formatFileSize(selectedModpack.fileSize)}</Text>
            </Group>
            <Group mb="md">
              <Text fw={700}>MD5:</Text>
              <Text>{selectedModpack.md5}</Text>
            </Group>
            <Group mb="md">
              <Text fw={700}>状态:</Text>
              <Badge color={statusMap[selectedModpack.status as ModpackStatus]?.color || 'gray'}>
                {statusMap[selectedModpack.status as ModpackStatus]?.label || '未知状态'}
              </Badge>
            </Group>
            {selectedModpack.reason && (
              <Group mb="md">
                <Text fw={700}>拒绝原因:</Text>
                <Text>{selectedModpack.reason}</Text>
              </Group>
            )}
            <Group mb="md">
              <Text fw={700}>创建时间:</Text>
              <Text>{new Date(selectedModpack.createTime).toLocaleString('zh-CN')}</Text>
            </Group>
            <Group mb="md">
              <Text fw={700}>更新时间:</Text>
              <Text>{new Date(selectedModpack.updateTime).toLocaleString('zh-CN')}</Text>
            </Group>
            <Text fw={700} mb="xs">
              简介:
            </Text>
            <Paper withBorder p="md" radius="md" mb="md">
              <Text>{selectedModpack.brief || '无简介'}</Text>
            </Paper>
            <Text fw={700} mb="xs">
              启动参数:
            </Text>
            <Paper withBorder p="md" radius="md" mb="md">
              <Text>{selectedModpack.launchArguments || '无启动参数'}</Text>
            </Paper>
            <Text fw={700} mb="xs">
              文件路径:
            </Text>
            <Paper withBorder p="md" radius="md" mb="md">
              <Text>{selectedModpack.filePath || '无文件路径'}</Text>
            </Paper>

            <Group justify="center" mt="xl">
              <Button variant="outline" onClick={close}>
                关闭
              </Button>
              <Button
                color="blue"
                onClick={() => {
                  close();
                  router.push(`${BACKEND_URL}/modpack/download/${selectedModpack.id}`);
                }}
              >
                下载整合包
              </Button>
              <Button
                color="red"
                onClick={() => {
                  openDelete();
                }}
              >
                删除整合包
              </Button>
            </Group>
          </Box>
        )}
      </Modal>

      {/* 删除确认对话框 */}
      <Modal opened={deleteOpened} onClose={closeDelete} title="确认删除" centered>
        <Text mb="lg">您确定要删除这个整合包吗？此操作不可撤销。</Text>
        <Group justify="center">
          <Button variant="outline" onClick={closeDelete}>
            取消
          </Button>
          <Button color="red" onClick={handleDelete}>
            确认删除
          </Button>
        </Group>
      </Modal>

      {/* 修改状态对话框 */}
      <Modal opened={statusOpened} onClose={closeStatus} title="修改整合包状态" centered>
        {selectedModpack && (
          <Box>
            <Text mb="md">
              当前状态: 
              <Badge ml="xs" color={statusMap[selectedModpack.status as ModpackStatus]?.color || 'gray'}>
                {statusMap[selectedModpack.status as ModpackStatus]?.label || '未知状态'}
              </Badge>
            </Text>
            <Select
              label="选择新状态"
              placeholder="请选择"
              value={newStatus?.toString()}
              onChange={(value) => setNewStatus(value ? parseInt(value) : null)}
              data={[
                { value: '0', label: '等待审核' },
                { value: '1', label: '审核中' },
                { value: '2', label: '已通过' },
                { value: '3', label: '未通过' },
              ]}
              mb="md"
              required
            />
            {newStatus === ModpackStatus.FAILED && (
              <TextInput
                label="拒绝原因"
                placeholder="请输入拒绝原因"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                mb="md"
                required
              />
            )}
            <Group justify="center" mt="xl">
              <Button variant="outline" onClick={closeStatus}>
                取消
              </Button>
              <Button 
                color="blue" 
                onClick={handleUpdateStatus}
                disabled={newStatus === null || (newStatus === ModpackStatus.FAILED && !rejectReason)}
              >
                确认修改
              </Button>
            </Group>
          </Box>
        )}
      </Modal>
    </Container>
  );
}