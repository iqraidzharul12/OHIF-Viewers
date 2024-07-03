import { Svg } from "@ohif/ui";
import { Breadcrumb, Layout, Menu, theme } from "antd";
import React from "react";

const { Header, Content, Footer, Sider } = Layout;

const DefaultLayout = ({children}) => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  return (
    <Layout className="w-screen" style={{minHeight: '100vh'}}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <Svg name="logo-ohif" />
      </Header>
      <Content style={{ padding: '0 48px' }}>
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
      <Footer style={{ textAlign: 'center' }}>
        ORTHANC ©{new Date().getFullYear()}
      </Footer>
    </Layout>
  )
}

export default DefaultLayout
