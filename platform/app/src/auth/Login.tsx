import React from "react";
import { Button, Card, Checkbox, Flex, Form, Grid, Input, theme, Typography } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { useLoginMutation } from "./Login.state";

const { useToken } = theme;
const { useBreakpoint } = Grid;
const { Text, Title } = Typography;

const Login = () => {
  const { token } = useToken();
  const screens = useBreakpoint();
  const { isSigningIn, doSignIn } = useLoginMutation()

  const onFinishFailed = () => {
    // Do nothing
}

  const styles = {
    container: {
      margin: "0 auto",
      textAlign: "center",
      padding: screens.md ? `${token.paddingXL}px` : `${token.sizeXXL}px ${token.padding}px`,
      width: "560px"
    },
    footer: {
      marginTop: token.marginLG,
      textAlign: "center",
      width: "100%"
    },
    forgotPassword: {
      float: "right"
    },
    header: {
      width: "380px",
      margin: "auto",
      padding: `${token.paddingXL}px`,
    },
    section: {
      alignItems: "center",
      backgroundColor: token.colorBgContainer,
      display: "flex",
      height: screens.sm ? "100vh" : "auto",
      padding: screens.md ? `${token.sizeXXL}px 0px` : "0px"
    },
    text: {
      color: token.colorTextSecondary
    },
    title: {
      fontSize: screens.md ? token.fontSizeHeading2 : token.fontSizeHeading3
    },
    button: {
      backgroundColor: token.colorPrimary,
    }
  };

  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <Card>
          <div style={styles.header}>
            <Flex justify="center">
              <svg
                width="25"
                height="24"
                viewBox="0 0 25 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="0.464294" width="24" height="24" rx="4.8" fill="#1890FF" />
                <path
                  d="M14.8643 3.6001H20.8643V9.6001H14.8643V3.6001Z"
                  fill="white"
                />
                <path
                  d="M10.0643 9.6001H14.8643V14.4001H10.0643V9.6001Z"
                  fill="white"
                />
                <path
                  d="M4.06427 13.2001H11.2643V20.4001H4.06427V13.2001Z"
                  fill="white"
                />
              </svg>
            </Flex>

            <Title style={styles.title}>Sign in</Title>
            <Text style={styles.text}>
              Welcome back to OHIF Viewer! Please enter your details below to
              sign in.
            </Text>
          </div>
          <Form
            name="normal_login"
            initialValues={{
              remember: true,
            }}
            onFinish={(values) => doSignIn(values)}
            onFinishFailed={onFinishFailed}
            layout="vertical"
            requiredMark="optional"
          >
            <Form.Item
              name="username"
              rules={[
                {
                  required: true,
                  message: "Please input your Username!",
                },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Username"
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: "Please input your Password!",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                type="password"
                placeholder="Password"
              />
            </Form.Item>
            <Flex justify="start">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
            </Flex>
            <Form.Item style={{ marginTop: "24px" }}>
              <Button style={styles.button} block={true} type="primary" htmlType="submit" loading={isSigningIn}>
                Log in
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </section>
  );
}

export default Login
