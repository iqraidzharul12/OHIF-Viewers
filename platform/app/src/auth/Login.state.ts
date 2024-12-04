import { useMutation } from '@tanstack/react-query'
import { ReactNode } from 'react'
import useSignIn from 'react-auth-kit/hooks/useSignIn';
import { useNavigate } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import axios from '../api/axios';
import { login, me } from '../api/endpoints/auth'
import { notificationState } from '../components/Notification/Notification.state'
import { useTranslation } from 'react-i18next';
import { AUTHENTICATION_KEY } from '../constants/localstorage';

export const useGetCurrentUserDetail = () => {
    // retrieve user authentication token
	const [, setNotification] = useRecoilState(notificationState)
    const { mutateAsync, isPending } = useMutation(
		{
			mutationFn: () => axios(me()),
			onSuccess: async (resp) => {
                const { data } = resp || {}
				console.log(data);
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
        doGetUser: mutateAsync,
        isGettingUser: isPending,
    }
}

export const useLoginMutation = () => {
    // performs login request
    const { t } = useTranslation()
	const [, setNotification] = useRecoilState(notificationState)
    const { doGetUser } = useGetCurrentUserDetail()
	const signIn = useSignIn()
	const navigate = useNavigate()
    const showError = () => {
        setNotification({
            error: {
                message: t('Failed to sign in'),
            },
        })
    }
	const { mutateAsync, isPending } = useMutation(
		{
			mutationFn: (data: object) => axios(login(data)),
			onSuccess: async (resp) => {
                const { data } = resp || {}
				if (data?.success) {
					localStorage.setItem(AUTHENTICATION_KEY, data?.data)
					const user = await doGetUser()
					signIn({
						auth: {
                            token: data?.data,
                            type: 'Bearer'
                        },
						userState: user?.data?.data,
					})
					setNotification(null)
					navigate('/')
                    // trigger state refresh, i.e. for auth token rehydration.
                    navigate(0)
				} else {
					showError()
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
		doSignIn: mutateAsync,
		isSigningIn: isPending,
	}
}
