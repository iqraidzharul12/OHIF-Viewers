import _axios from 'axios'
import { onErrorResponse, requestInterceptor, responseInterceptor } from './interceptors'

const axios = _axios.create({
	// Append endpoint url as the base API url
	baseURL: process.env.API_ENDPOINT_URL,
})

axios.interceptors.request.use(requestInterceptor)
axios.interceptors.response.use(responseInterceptor, onErrorResponse)

export default axios
