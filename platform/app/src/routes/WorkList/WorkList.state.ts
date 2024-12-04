import { useMutation } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useRecoilState } from 'recoil'
import { allSeriesByStudyId, allStudies } from '../../api/endpoints/studies';
import { notificationState } from '../../components/Notification/Notification.state';
import axios from '../../api/axios';


export const useGetStudies = () => {
	const [, setNotification] = useRecoilState(notificationState)
    const { mutateAsync, isPending } = useMutation(
		{
			mutationFn: () => axios(allStudies()),
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
        doGetStudies: mutateAsync,
        isGettingStudies: isPending,
    }
}

export const useGetSeriesByStudyId = () => {
	const [, setNotification] = useRecoilState(notificationState)
    const { mutateAsync, isPending } = useMutation(
		{
			mutationFn: (id: string) => axios(allSeriesByStudyId(id)),
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
        doGetSeriesByStudyId: mutateAsync,
        isGettingSeriesByStudyId: isPending,
    }
}
