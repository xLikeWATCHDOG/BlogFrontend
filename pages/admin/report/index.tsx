import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IconAlertCircle, IconEye, IconExternalLink } from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Container,
  Group,
  Loader,
  Modal,
  Pagination,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { BACKEND_URL } from '@/data/global';

// 举报类型定义
interface Report {
  id: number;
  reporter: number; // 举报者ID
  itemId: number; // 被举报项目ID
  type: number; // 举报类型
  reason: string; // 举报原因
  status: number; // 举报状态
  createTime: string;
  updateTime: string;
  available: number; // 可用性
  // 前端额外字段
  reporterName?: string; // 举报人用户名
  detail?: string; // 详细说明（如果有）
}

// 分页数据类型
interface PageData {
  records: Report[];
  totalPage: number;
  pageSize: number;
  pageNumber: number;
  totalRow: number;
}

export default function AdminReportList() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  // 获取用户信息
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const loginToken = localStorage.getItem('loginToken');
        if (!loginToken) {
          notifications.show({
            title: '需要登录',
            message: '请先登录后再查看举报列表',
            color: 'red',
          });
          router.push('/');
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

        setUser(data.data);
        fetchReports(currentPage, pageSize, data.data.uid);
      } catch (error) {
        console.error('登录检查失败:', error);
        notifications.show({
          title: '登录检查失败',
          message: error instanceof Error ? error.message : '未知错误',
          color: 'red',
        });
        router.push('/');
      }
    };

    //checkLogin();
  }, [router]);

  // 获取举报列表
  const fetchReports = async (page: number, size: number, uid: number) => {
    setLoading(true);
    try {
      const loginToken = localStorage.getItem('loginToken');
      const response = await fetch(`${BACKEND_URL}/report/page`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          loginToken: loginToken || '',
        },
        body: JSON.stringify({
          current: page,
          pageSize: size,
          sortField: 'createTime',
          sortOrder: 'desc',
        }),
      });

      if (!response.ok) {
        throw new Error('获取举报列表失败');
      }

      const data = await response.json();
      if (data.code !== 20000) {
        throw new Error(data.message || '获取举报列表失败');
      }

      setReports(data.data.records || []);
      setPageData(data.data);
      setCurrentPage(data.data.current);
    } catch (err) {
      console.error('获取举报列表失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 处理页码变化
  const handlePageChange = (page: number) => {
    if (user) {
      setCurrentPage(page);
      fetchReports(page, pageSize, user.uid);
    }
  };

  // 处理每页显示数量变化
  const handlePageSizeChange = (value: string | null) => {
    if (value && user) {
      const newSize = parseInt(value);
      setPageSize(newSize);
      setCurrentPage(1);
      fetchReports(1, newSize, user.uid);
    }
  };

  // 查看举报详情
  const viewReportDetail = (report: Report) => {
    setSelectedReport(report);
    open();
  };

  // 获取举报状态标签
  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge color="yellow">等待审核</Badge>;
      case 1:
        return <Badge color="blue">审核中</Badge>;
      case 2:
        return <Badge color="green">审核通过</Badge>;
      case 3:
        return <Badge color="red">审核不通过</Badge>;
      default:
        return <Badge color="gray">未知状态</Badge>;
    }
  };

  // 获取举报类型标签
  const getTypeBadge = (type: number) => {
    switch (type) {
      case 0:
        return <Badge color="blue">评论</Badge>;
      case 1:
        return <Badge color="violet">文章</Badge>;
      case 2:
        return <Badge color="green">用户</Badge>;
      case 3:
        return <Badge color="orange">整合包</Badge>;
      default:
        return <Badge color="gray">未知类型</Badge>;
    }
  };

  // 获取举报原因
  const getReasonText = (reason: string) => {
    const reasonMap: Record<string, string> = {
      spam: '垃圾信息',
      inappropriate: '不适当内容',
      illegal: '违法内容',
      harassment: '骚扰',
      pornographic: '色情内容',
      violence: '暴力内容',
      hate: '仇恨言论',
      other: '其他原因',
    };

    return reasonMap[reason] || reason;
  };

  // 加载中状态
  if (loading && !reports.length) {
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
        我的举报记录
      </Title>

      {reports.length === 0 ? (
        <Paper withBorder p="xl" radius="md" ta="center">
          <Text size="lg" fw={500} mb="md">
            暂无举报记录
          </Text>
          <Text c="dimmed">您还没有提交过任何举报</Text>
          <Button mt="xl" onClick={() => router.push('/')}>
            返回首页
          </Button>
        </Paper>
      ) : (
        <>
          <Paper withBorder radius="md" mb="xl">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>类型</Table.Th>
                  <Table.Th>原因</Table.Th>
                  <Table.Th>状态</Table.Th>
                  <Table.Th>提交时间</Table.Th>
                  <Table.Th>操作</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {reports.map((report) => (
                  <Table.Tr key={report.id}>
                    <Table.Td>{report.id}</Table.Td>
                    <Table.Td>{getTypeBadge(report.type)}</Table.Td>
                    <Table.Td>{getReasonText(report.reason)}</Table.Td>
                    <Table.Td>{getStatusBadge(report.status)}</Table.Td>
                    <Table.Td>{new Date(report.createTime).toLocaleString('zh-CN')}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          color="blue"
                          onClick={() => viewReportDetail(report)}
                          title="查看详情"
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                        <ActionIcon
                          color="green"
                          onClick={() => window.open(`${BACKEND_URL}/report/redict?id=${report.id}`, '_blank')}
                          title="跳转到原内容"
                        >
                          <IconExternalLink size={16} />
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

      {/* 举报详情模态框 */}
      <Modal opened={opened} onClose={close} title="举报详情" centered size="lg">
        {selectedReport && (
          <Box>
            <Group mb="md">
              <Text fw={700}>举报ID:</Text>
              <Text>{selectedReport.id}</Text>
            </Group>
            <Group mb="md">
              <Text fw={700}>举报类型:</Text>
              <Text>
                {selectedReport.type === 0
                  ? '评论'
                  : selectedReport.type === 1
                    ? '文章'
                    : selectedReport.type === 2
                      ? '用户'
                      : selectedReport.type === 3
                        ? '整合包'
                        : '未知类型'}
              </Text>
            </Group>
            <Group mb="md">
              <Text fw={700}>被举报项目ID:</Text>
              <Text>{selectedReport.itemId}</Text>
            </Group>
            <Group mb="md">
              <Text fw={700}>举报原因:</Text>
              <Text>{getReasonText(selectedReport.reason)}</Text>
            </Group>
            <Group mb="md">
              <Text fw={700}>举报状态:</Text>
              <Text>
                {selectedReport.status === 0
                  ? '等待审核'
                  : selectedReport.status === 1
                    ? '审核中'
                    : selectedReport.status === 2
                      ? '审核通过'
                      : selectedReport.status === 3
                        ? '审核不通过'
                        : '未知状态'}
              </Text>
            </Group>
            <Group mb="md">
              <Text fw={700}>提交时间:</Text>
              <Text>{new Date(selectedReport.createTime).toLocaleString('zh-CN')}</Text>
            </Group>
            {selectedReport.updateTime && (
              <Group mb="md">
                <Text fw={700}>处理时间:</Text>
                <Text>{new Date(selectedReport.updateTime).toLocaleString('zh-CN')}</Text>
              </Group>
            )}
            {selectedReport.detail && (
              <>
                <Text fw={700} mb="xs">
                  详细说明:
                </Text>
                <Paper withBorder p="md" radius="md">
                  <Text>{selectedReport.detail || '无详细说明'}</Text>
                </Paper>
              </>
            )}

            <Group justify="center" mt="xl">
              <Button onClick={close}>关闭</Button>
              {selectedReport.type === 1 ? (
                <Button
                  color="blue"
                  onClick={() => {
                    close();
                    router.push(`/blog/${selectedReport.itemId}`);
                  }}
                >
                  查看文章
                </Button>
              ) : selectedReport.type === 2 ? (
                <Button
                  color="blue"
                  onClick={() => {
                    close();
                    router.push(`/user/${selectedReport.itemId}`);
                  }}
                >
                  查看用户
                </Button>
              ) : null}
            </Group>
          </Box>
        )}
      </Modal>
    </Container>
  );
}
