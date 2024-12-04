import { Avatar, Divider, Dropdown, Flex, MenuProps } from 'antd'
import React from 'react'
import useSignOut from 'react-auth-kit/hooks/useSignOut'
import useAuthUser from 'react-auth-kit/hooks/useAuthUser'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { UserOutlined } from '@ant-design/icons';

const UserProfile = () => {
    const { t } = useTranslation()
    const logout = useSignOut()
    const user = useAuthUser()

    const navigate = useNavigate()
    const items: MenuProps['items'] = [
        {
            label: t(`User Management`),
            key: '/user-management',
        },
        {
            label: t(`Logout`),
            key: 'logout',
        },
    ]
    const onClick: MenuProps['onClick'] = ({ key }) => {
        // Log out directly from the client side
        // since there is no API for /logout
        if (key === 'logout') {
            logout()
        } else {
            navigate(key as string)
        }
    }
    return (
        <Dropdown
            menu={{ items, onClick }}
            trigger={['click']}
        >
            <div>
                <span style={{color: '#fff', marginRight: '8px'}}>Hi, {user?.fullname}</span>
                <Avatar
                    shape="square"
                    size="large"
                    icon={<UserOutlined />}
                    data-testid="user-profile"
                />
            </div>
        </Dropdown>
    )
}

export default UserProfile
