import { AxiosRequestConfig } from 'axios'

export const login = (data: object): AxiosRequestConfig => {
	return {
		url: `/authentication/login`,
		method: 'POST',
		data
	}
}

export const me = (): AxiosRequestConfig => {
	return {
		url: `/application-user/me`,
		method: 'GET'
	}
}

export const refreshToken = (currentToken: string): AxiosRequestConfig => {
	return {
		url: `/identity/authentication/refreshToken`,
		method: 'POST',
		data: { jwt: currentToken},
	}
}
