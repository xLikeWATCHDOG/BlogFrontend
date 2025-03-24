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
  Paper,
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
  const [modpackFile, setModpackFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

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
        if (!value) return '简介为必填项';
        if (value.length < 10) return '简介至少需要10个字符';
        return null;
      },
      client: (value) => {
        if (!value) return '客户端名称为必填项';
        if (value.length < 3) return '客户端名称至少需要3个字符';
        return null;
      },
      version: (value) => (!value ? '版本号为必填项' : null),
      logoFile: (value) => (!value ? '请上传整合包Logo' : null),
    },
  });

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

  // 提交表单
  const handleSubmit = async (values: typeof form.values) => {
    if (!modpackFile) {
      notifications.show({
        title: '错误',
        message: '请上传整合包文件',
        color: 'red',
        icon: <IconX size={16} />,
      });
      return;
    }

    try {
      // 使用腾讯验证码
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const captcha = new TencentCaptcha('190249560', async (res) => {
        if (res.ret === 0) {
          try {
            setLoading(true);
            const formData = new FormData();
            formData.append('modpackFile', modpackFile);
            if (logoFile) formData.append('logoFile', logoFile);
            formData.append('name', values.name);
            formData.append('launchArguments', values.launchArguments);
            formData.append('brief', values.brief);
            formData.append('client', values.client);
            formData.append('version', values.version);

            const loginToken = localStorage.getItem('loginToken');
            const response = await fetch(`${BACKEND_URL}/modpack/upload`, {
              method: 'POST',
              headers: {
                loginToken: loginToken || '',
                captcha: JSON.stringify(res),
              },
              body: formData,
            });

            const data = await response.json();

            if (data.code === 20000) {
              notifications.show({
                title: '成功',
                message: '整合包上传成功',
                color: 'green',
                icon: <IconCheck size={16} />,
              });
              router.push('/modpack/my');
            } else {
              throw new Error(data.message || '上传失败');
            }
          } catch (error) {
            notifications.show({
              title: '错误',
              message: error instanceof Error ? error.message : '网络错误，请稍后重试',
              color: 'red',
              icon: <IconX size={16} />,
            });
          } finally {
            setLoading(false);
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
    <Box pb={80}>
      <Container size="sm" mt="xl">
        <Title order={2} ta="center" mb="xl">
          上传新整合包
        </Title>
        <Paper p="md" withBorder shadow="sm">
          <LoadingOverlay visible={loading} />

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              {/* 整合包名称 */}
              <TextInput
                required
                label="整合包名称"
                placeholder="输入整合包名称"
                {...form.getInputProps('name')}
              />

              {/* 启动参数 */}
              <TextInput
                required
                label="启动参数"
                placeholder="输入整合包启动参数"
                {...form.getInputProps('launchArguments')}
              />
              
              {/* 其余表单字段保持不变 */}
              {/* 整合包版本 */}
              <TextInput
                required
                label="整合包版本"
                placeholder="输入整合包版本号，如1.0.0"
                {...form.getInputProps('version')}
              />

              {/* 整合包上传 */}
              <Box>
                <Text fw={500} size="sm" mb={5}>
                  整合包文件{' '}
                  <Text component="span" c="red">
                    *
                  </Text>
                </Text>
                <Group
                  justify="center"
                  gap="xl"
                  p="md"
                  style={{ border: '1px dashed #ced4da', borderRadius: '4px' }}
                >
                  <FileButton onChange={setModpackFile} accept=".zip">
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
                    请上传整合包文件 (仅支持.zip格式)
                  </Text>
                )}
              </Box>

              {/* 简介 */}
              <Textarea
                required
                label="整合包简介"
                placeholder="请输入整合包的简要描述"
                minRows={4}
                {...form.getInputProps('brief')}
              />

              {/* 客户端 */}
              <TextInput
                required
                label="作者链接"
                placeholder="输入作者链接或联系方式"
                {...form.getInputProps('client')}
              />

              {/* Logo上传 */}
              <Box>
                <Text fw={500} size="sm" mb={5}>
                  整合包Logo{' '}
                  <Text component="span" c="red">
                    *
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

              {logoPreview && (
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
                  提交
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
