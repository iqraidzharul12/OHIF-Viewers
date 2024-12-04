import { AxiosError, AxiosResponse } from 'axios'
import { AUTHENTICATION_KEY } from '../constants/localstorage'

export const requestInterceptor = (config) => {
    // get authentication token from the storage
    const token = localStorage.getItem(AUTHENTICATION_KEY)
    if (token) {
        // append the token to the request header
        config.headers.authorization = `Bearer ${token}`
    }
    return config
}

export const responseInterceptor = (response: AxiosResponse): AxiosResponse => {
    // when a request returns 200 but its success flag is false
    // treat it as a failed request
    if (response.data.success === false || response.data.error) {
        throw response
    }
    return response
}

export const onErrorResponse = (error: AxiosError): void => {
    const { response } = error
    if (response?.status === 401) {
        // remove authentication data when the server returns 401
        // and redirect to the login page
        localStorage.clear();
        // (window as Window).location = '/login'
    } else {
        Promise.reject(error)
    }
}
