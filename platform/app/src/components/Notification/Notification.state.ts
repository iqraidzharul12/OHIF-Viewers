import { atom } from 'recoil'
import { notification } from 'antd'
import { ArgsProps } from 'antd/es/notification/interface'


export type NotificationMethods = keyof Pick<
    typeof notification,
    'open' | 'error' | 'success' | 'warning'
>
export type NotificationObject = Partial<
    Record<NotificationMethods, ArgsProps>
> | null

export const notificationState = atom<NotificationObject>({
	key: 'notificationState',
	default: null,
})
