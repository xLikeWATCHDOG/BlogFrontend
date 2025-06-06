import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { IconCheck, IconUpload, IconX } from '@tabler/icons-react';
import {
  Box,
  Button,
  Container,
  FileButton,
  Group,
  Image,
  LoadingOverlay,
  Modal,
  Paper,
  Progress,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { BACKEND_URL } from '@/data/global';

export default function NewModpackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [modpackFile, setModpackFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [pageType, setPageType] = useState<'new' | 'update' | 'edit'>('new');

  // 表单定义
  const form = useForm({
    initialValues: {
      name: '',
      launchArguments: '',
      brief: '',
      client: '',
      version: '',
      logoFile: null as File | null,
    },
    validate: {
      name: (value) => {
        if (!value) return '整合包名称为必填项';
        if (value.length < 2) return '整合包名称至少需要2个字符';
        return null;
      },
      launchArguments: (value) => (!value ? '启动参数为必填项' : null),
      brief: (value) => {
        // 简介在new和edit模式下为必填项
        const urlType = router.query.type;
        if ((urlType === 'edit' || !urlType || urlType === 'new') && !value) return '整合包简介为必填项';
        if ((urlType === 'edit' || !urlType || urlType === 'new') && value && value.length < 10) return '简介至少需要10个字符';
        return null;
      },
      client: (value) => {
        // 作者链接在new和edit模式下为必填项
        const urlType = router.query.type;
        if ((urlType === 'edit' || !urlType || urlType === 'new') && !value) return '作者链接为必填项';
        if ((urlType === 'edit' || !urlType || urlType === 'new') && value && value.length < 3) return '作者链接至少需要3个字符';
        return null;
      },
      version: (value) => (!value ? '版本号为必填项' : null),
      logoFile: (value) => {
        const urlType = router.query.type;
        if ((!urlType || urlType === 'new') && !value) return '请上传整合包Logo';
        return null;
      },
    },
  });

  // 获取整合包信息并填充表单
  const fetchModpackInfo = async (id: string) => {
    const loginToken = localStorage.getItem('loginToken');
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/modpack/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          loginToken: loginToken || '',
        }});
      const data = await response.json();

      if (data.code === 20000 && data.data) {
        const modpackData = data.data;
        // 自动填充表单
        form.setValues({
          name: modpackData.name || '',
          launchArguments: modpackData.launchArguments || '',
          brief: modpackData.brief || '',
          client: modpackData.client || '',
          version: modpackData.version || '',
          logoFile: null, // logo文件需要重新上传
        });

        // 如果有logo URL，设置预览
        if (modpackData.logoUrl) {
          setLogoPreview(modpackData.logoUrl);
        }

        setIsEditing(true);
      } else {
        notifications.show({
          title: '错误',
          message: '获取整合包信息失败',
          color: 'red',
          icon: <IconX size={16} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: '错误',
        message: '网络错误，请稍后重试',
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  // 检查URL参数并获取整合包信息
  React.useEffect(() => {
    if (router.isReady) {
      const { id, type } = router.query;
      
      // 设置页面类型
      if (type === 'update') {
        setPageType('update');
      } else if (type === 'edit') {
        setPageType('edit');
      } else {
        setPageType('new');
      }
      
      if (id && typeof id === 'string') {
        fetchModpackInfo(id);
      }
    }
  }, [router.isReady, router.query]);

  // 处理logo预览
  React.useEffect(() => {
    if (logoFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(logoFile);
    }
  }, [logoFile]);

  // 文件大小检查
  const validateFileSize = (file: File) => {
    const maxSize = 3 * 1024 * 1024 * 1024; // 3GB
    if (file.size > maxSize) {
      notifications.show({
        title: '文件过大',
        message: '文件大小不能超过3GB',
        color: 'red',
        icon: <IconX size={16} />,
      });
      return false;
    }
    return true;
  };

  // 获取页面标题
  const getPageTitle = () => {
    switch (pageType) {
      case 'update':
        return '更新整合包';
      case 'edit':
        return '编辑整合包';
      default:
        return '上传新整合包';
    }
  };

  // 获取API端点 - 统一使用upload接口
  const getApiEndpoint = () => {
    return `${BACKEND_URL}/modpack/upload`;
  };

  // 提交表单 - 支持进度条模态框
  const handleSubmit = async (values: typeof form.values) => {
    // 根据不同模式验证必填项
    if (pageType === 'new') {
      if (!modpackFile) {
        notifications.show({
          title: '错误',
          message: '请上传整合包文件',
          color: 'red',
          icon: <IconX size={16} />,
        });
        return;
      }
      if (!validateFileSize(modpackFile)) {
        return;
      }
    } else if (pageType === 'update') {
      if (modpackFile && !validateFileSize(modpackFile)) {
        return;
      }
    }

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const captcha = new TencentCaptcha('190249560', async (res) => {
        if (res.ret === 0) {
          try {
            setLoading(true);
            setUploadProgress(0);
            setShowUploadModal(true); // 显示上传模态框

            const formData = new FormData();
            
            // 添加操作类型
            formData.append('type', pageType);
            
            // 如果是编辑或更新模式，添加ID
            if (pageType === 'edit' || pageType === 'update') {
              formData.append('id', router.query.id as string);
            }
            
            // 根据不同模式添加不同的字段
            if (pageType === 'new') {
              // 新建模式：所有字段
              if (modpackFile) formData.append('modpackFile', modpackFile);
              if (logoFile) formData.append('logoFile', logoFile);
              formData.append('name', values.name);
              formData.append('launchArguments', values.launchArguments);
              formData.append('brief', values.brief);
              formData.append('client', values.client);
              formData.append('version', values.version);
            } else if (pageType === 'update') {
              // 更新模式：整合包参数、版本和文件
              if (modpackFile) formData.append('modpackFile', modpackFile);
              if (values.launchArguments) formData.append('launchArguments', values.launchArguments);
              if (values.version) formData.append('version', values.version);
            } else if (pageType === 'edit') {
              // 编辑模式：介绍、logo
              if (logoFile) formData.append('logoFile', logoFile);
              if (values.brief) formData.append('brief', values.brief);
              if (values.client) formData.append('client', values.client);
            }

            const loginToken = localStorage.getItem('loginToken');

            // 使用XMLHttpRequest支持进度监听
            const xhr = new XMLHttpRequest();

            // 监听上传进度
            xhr.upload.addEventListener('progress', (event) => {
              if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(percentComplete);
              }
            });

            // 处理响应
            xhr.addEventListener('load', () => {
              setShowUploadModal(false); // 隐藏模态框
              if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                if (data.code === 20000) {
                  notifications.show({
                    title: '成功',
                    message: pageType === 'new' ? '整合包上传成功' : 
                            pageType === 'update' ? '整合包更新成功' : '整合包编辑成功',
                    color: 'green',
                    icon: <IconCheck size={16} />,
                  });
                  router.push('/modpack/my');
                } else {
                  throw new Error(data.message || '操作失败');
                }
              } else {
                throw new Error('网络错误');
              }
            });

            xhr.addEventListener('error', () => {
              setShowUploadModal(false); // 隐藏模态框
              throw new Error('网络错误，请稍后重试');
            });

            // 发送请求 - 统一使用upload接口
            xhr.open('POST', getApiEndpoint());
            xhr.setRequestHeader('loginToken', loginToken || '');
            xhr.setRequestHeader('captcha', JSON.stringify(res));
            xhr.send(formData);

          } catch (error) {
            setShowUploadModal(false); // 隐藏模态框
            notifications.show({
              title: '错误',
              message: error instanceof Error ? error.message : '网络错误，请稍后重试',
              color: 'red',
              icon: <IconX size={16} />,
            });
            setLoading(false);
            setUploadProgress(0);
          }
        }
      });
      captcha.show();
    } catch (error) {
      notifications.show({
        title: '验证失败',
        message: '请稍后重试',
        color: 'red',
      });
    }
  };

  return (
    <>
      {/* 上传进度模态框 */}
      <Modal
        opened={showUploadModal}
        onClose={() => {}} // 禁止手动关闭
        title="上传进度"
        centered
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
        size="md"
        overlayProps={{
          backgroundOpacity: 0.7,
          blur: 3,
        }}
      >
        <Stack gap="md" p="md">
          <Text size="lg" fw={500} ta="center">
            正在{pageType === 'new' ? '上传' : pageType === 'update' ? '更新' : '编辑'}整合包...
          </Text>

          <Box>
            <Group justify="space-between" mb={5}>
              <Text size="sm">上传进度</Text>
              <Text size="sm" fw={500}>{uploadProgress}%</Text>
            </Group>
            <Progress
              value={uploadProgress}
              size="xl"
              radius="md"
              animated
              color="blue"
            />
          </Box>

          {modpackFile && (
            <Text size="sm" c="dimmed" ta="center">
              文件: {modpackFile.name} ({Math.round((modpackFile.size / 1024 / 1024) * 100) / 100}MB)
            </Text>
          )}

          <Text size="xs" c="dimmed" ta="center">
            请勿关闭页面，上传过程中请耐心等待...
          </Text>
        </Stack>
      </Modal>

      <Box pb={80}>
        <Container size="sm" mt="xl">
          <Title order={2} ta="center" mb="xl">
            {getPageTitle()}
          </Title>
          <Paper p="md" withBorder shadow="sm">
            <LoadingOverlay visible={loading && !showUploadModal} />

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                {/* 整合包名称 - update和edit模式下都不可编辑 */}
                <TextInput
                  required={pageType === 'new'}
                  label="整合包名称"
                  placeholder="输入整合包名称"
                  disabled={pageType === 'update' || pageType === 'edit'}
                  {...form.getInputProps('name')}
                />

                {/* 启动参数 - edit模式下隐藏 */}
                {pageType !== 'edit' && (
                  <TextInput
                    required
                    label="启动参数"
                    placeholder="输入整合包启动参数"
                    {...form.getInputProps('launchArguments')}
                  />
                )}

                {/* 整合包版本 - edit模式下隐藏 */}
                {pageType !== 'edit' && (
                  <TextInput
                    required
                    label="整合包版本"
                    placeholder="输入整合包版本号，如1.0.0"
                    {...form.getInputProps('version')}
                  />
                )}

                {/* 整合包上传 - edit模式下隐藏 */}
                {pageType !== 'edit' && (
                  <Box>
                    <Text fw={500} size="sm" mb={5}>
                      整合包文件{' '}
                      <Text component="span" c="red">
                        *
                      </Text>
                      <Text component="span" c="dimmed" size="xs">
                        {' '}(最大3GB)
                      </Text>
                    </Text>
                    <Group
                      justify="center"
                      gap="xl"
                      p="md"
                      style={{ border: '1px dashed #ced4da', borderRadius: '4px' }}
                    >
                      <FileButton
                        onChange={(file) => {
                          if (file && validateFileSize(file)) {
                            setModpackFile(file);
                          }
                        }}
                        accept=".zip"
                      >
                        {(props) => (
                          <Button {...props} leftSection={<IconUpload size={16} />}>
                            选择整合包文件
                          </Button>
                        )}
                      </FileButton>
                      {modpackFile && (
                        <Text size="sm">
                          已选择: {modpackFile.name} (
                          {Math.round((modpackFile.size / 1024 / 1024) * 100) / 100}MB)
                        </Text>
                      )}
                    </Group>
                    {!modpackFile && form.isTouched() && (
                      <Text c="red" size="xs" mt={5}>
                        请上传整合包文件 (仅支持.zip格式，最大3GB)
                      </Text>
                    )}
                  </Box>
                )}

                {/* 简介 - 仅在new和edit模式下显示 */}
                {pageType !== 'update' && (
                  <Textarea
                    required
                    label="整合包简介"
                    placeholder="请输入整合包的简要描述"
                    minRows={4}
                    {...form.getInputProps('brief')}
                  />
                )}

                {/* 作者链接 - 仅在new和edit模式下显示 */}
                {pageType !== 'update' && (
                  <TextInput
                    required
                    label="作者链接"
                    placeholder="输入作者链接或联系方式"
                    {...form.getInputProps('client')}
                  />
                )}

                {/* Logo上传 - 仅在new和edit模式下显示 */}
                {pageType !== 'update' && (
                  <Box>
                    <Text fw={500} size="sm" mb={5}>
                      整合包Logo{' '}
                      {pageType === 'new' && (
                        <Text component="span" c="red">
                          *
                        </Text>
                      )}
                    </Text>
                    <Group
                      justify="center"
                      gap="xl"
                      p="md"
                      style={{ border: '1px dashed #ced4da', borderRadius: '4px' }}
                    >
                      <FileButton
                        onChange={(file) => {
                          setLogoFile(file);
                          form.setFieldValue('logoFile', file);
                        }}
                        accept="image/png,image/jpeg,image/gif"
                      >
                        {(props) => (
                          <Button {...props} leftSection={<IconUpload size={16} />}>
                            选择Logo图片
                          </Button>
                        )}
                      </FileButton>
                      {form.values.logoFile && (
                        <Text size="sm">已选择: {form.values.logoFile.name}</Text>
                      )}
                    </Group>
                    {form.errors.logoFile && (
                      <Text c="red" size="xs" mt={5}>
                        {form.errors.logoFile}
                      </Text>
                    )}
                  </Box>
                )}

                {logoPreview && pageType !== 'update' && (
                  <Box>
                    <Text fw={500} size="sm" mb={5}>
                      预览:
                    </Text>
                    <Image
                      src={logoPreview}
                      width={200}
                      height={150}
                      fit="cover"
                      radius="md"
                      alt="Logo预览"
                    />
                  </Box>
                )}

                <Group justify="flex-end" mt="md">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    取消
                  </Button>
                  <Button type="submit" loading={loading}>
                    {pageType === 'new' ? '提交' : pageType === 'update' ? '更新' : '保存'}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        </Container>
      </Box>
    </>
  );
}
