import { notification } from 'antd'
import { ArgsProps } from 'antd/es/notification/interface'
import { useEffect } from 'react'
import { useRecoilValue } from 'recoil'
import { notificationState } from './Notification.state'

export type NotificationMethods = keyof Pick<
    typeof notification,
    'open' | 'error' | 'success' | 'warning'
>
export type NotificationObject = Partial<
    Record<NotificationMethods, ArgsProps>
> | null

const Notification = () => {
	const notifications = useRecoilValue(notificationState)
	const [api, contextHolder] = notification.useNotification()
	useEffect(() => {
		const openNotification = (notificationObject: NotificationObject) => {
            if (!notificationObject) return
			// show conditional notification based on the method
            // you pass a notification object with the method as key:
            //  {
            //      [method]: NotificationObject
            //  }, e.g.:
            //  {
            //      success: {
            //          message: 'Success notification title',
            //          description: 'Success notification content that is long, it can be in multiple lines',
            //      }
            //  }
            // API: https://ant.design/components/notification#api
			const method = Object.keys(notificationObject).pop() as NotificationMethods
			const value = Object.values(notificationObject).pop() as ArgsProps
			api[method]({
				key: 'updatable',
				...value,
			})
		}
		openNotification(notifications)
	}, [notifications, api])

	return contextHolder
}

export default Notification
