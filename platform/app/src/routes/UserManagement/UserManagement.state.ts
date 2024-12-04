import { useMutation } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useRecoilState } from 'recoil'
import { notificationState } from '../../components/Notification/Notification.state';
import axios from '../../api/axios';
import { datatable } from '../../api/endpoints/application-user';

export const useApplicationUserDatatable = () => {
	const [, setNotification] = useRecoilState(notificationState)
    const { mutateAsync, isPending } = useMutation(
		{
			mutationFn: (payload: object) => axios(datatable(payload)),
			onSuccess: async (resp) => {
        const { data } = resp || {}
				if (data?.success) {
					return data?.data
				} else {
					return undefined
				}
			},
			onError: (response: { data: Record<string, ReactNode> }) => {
				setNotification({
					error: {
						message: response?.data?.message || (response?.data?.error as unknown as { message: string })?.message,
					},
				})
			},
		}
	)
    return {
        doApplicationUserDatatable: mutateAsync,
        isApplicationUserDatatablePending: isPending,
    }
}
