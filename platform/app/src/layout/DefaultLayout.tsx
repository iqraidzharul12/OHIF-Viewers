import { Svg } from "@ohif/ui";
import { Breadcrumb, Flex, Layout, Menu, theme } from "antd";
import React from "react";
import UserProfile from "../components/UserProfile";

const { Header, Content, Footer, Sider } = Layout;

const DefaultLayout = ({children, auth = false}) => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const items = new Array(1).fill(null).map((_, index) => ({
    key: index + 1,
    label: <UserProfile />,
  }));

  return (
    <Layout className="w-screen" style={{minHeight: '100vh'}}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Svg name="logo-ohif" />
        {/* <Menu
          mode="horizontal"
          items={[
            {
              key: "user-profile",
              label: <UserProfile />,
            }
          ]}
          style={{ minWidth: 0 }}
        /> */}
        <UserProfile />
      </Header>
      {
        auth? children
        : <Content style={{ padding: '0 48px' }}>
          <Breadcrumb style={{ margin: '16px 0' }}>
          </Breadcrumb>
          <Layout
            style={{ padding: '24px 0', background: colorBgContainer, borderRadius: borderRadiusLG }}
          >
            <Content style={{ padding: '0 24px', minHeight: 280 }}>
              { children }
            </Content>
          </Layout>
        </Content>
      }
      <Footer style={{ textAlign: 'center' }}>
        PACS ©{new Date().getFullYear()}
      </Footer>
    </Layout>
  )
}

export default DefaultLayout
